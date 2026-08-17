#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
  ACGC_E2_TARGET_CONTEXT_TOKEN_V01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  ACGC_E2_HISTORICAL_COHORT_ID_V01,
  ACGC_E2_HISTORICAL_RUN_ROOT_V01,
  assertOperationalReentryMatchedCohortReplacementIdentityAvailableV02,
  beginOperationalReentryMatchedCohortAttemptV01,
  validateOperationalReentryMatchedCohortArtifactsV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import {
  ACGC_E2_SEALED_ORDER_V01,
  buildOperationalReentryMatchedCohortCallPlanV01,
  buildOperationalReentryMatchedCohortPricingV01,
  buildOperationalReentryMatchedCohortReplacementLineageV02,
  buildOperationalReentryMatchedCohortV01,
  deriveOperationalReentryMatchedCohortExactCaseDispositionsV01,
  deriveOperationalReentryMatchedCohortPairwiseRelationV01,
  deriveOperationalReentryMatchedCohortRepeatabilityV01,
  runOperationalReentryMatchedCohortV01,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV01,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  ModelGatewayAdapterFailureV01,
  ModelGatewayInvocationErrorV01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesAdapterV01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  operationalReentryMatchedCohortResponseSchemaV01,
  operationalReentryMatchedCohortResponseSchemaV02,
  parseOperationalReentryMatchedCohortOutputV01,
  projectOperationalReentryMatchedCohortModelMaterialV01,
  validateOperationalReentryMatchedCohortModelInputV01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import {
  OPENAI_STRICT_SCHEMA_MAX_NESTING_LEVELS_V01,
  OPENAI_STRICT_SCHEMA_MAX_TOTAL_ENUM_VALUES_V01,
  OPENAI_STRICT_SCHEMA_MAX_TOTAL_STRING_CHARACTERS_V01,
  OpenAIStrictSchemaSupportedSubsetErrorV01,
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
import { buildOperationalReentryPerturbationFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import type {
  OperationalReentryMatchedCohortArmEvaluationV01,
  OperationalReentryMatchedCohortModelInputV01,
  OperationalReentryMatchedCohortModelOutputV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03 } from "@/types/vnext/operational-reentry-matched-cohort";

const root = mkdtempSync(path.join(tmpdir(), "augnes-e2-cohort-"));
const projectRoot = path.join(root, "project");
const databasePath = path.join(root, "gateway.db");
const sourceHead = "1234567890abcdef1234567890abcdef12345678";
const providerRequestTraceId =
  createDeterministicModelProviderRequestTraceV01({
    request_family_kind: "cohort_attempt",
    request_family_fingerprint: `sha256:${"b".repeat(64)}`,
  });

void main().finally(() => rmSync(root, { recursive: true, force: true })).catch((error) => {
  console.error("operational_reentry_matched_cohort_test_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(path.join(projectRoot, ".gitignore"), ".augnes-lab/\n");
  initializeDatabaseV01();
  const admission = registerProjectV01();
  const databaseBeforeGatewayRuns = readFileSync(databasePath);
  const adapter = fakeAdapterV01();
  const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({ adapter });
  assert.ok(route);

  verifyFrozenSourceCaseAndRubricV01();
  verifyCallPlanAndParityV01();
  verifyStrictCodecAndProviderProjectionV01();
  verifyCorrectedSchemaBoundaryV02();
  verifyClientRequestIdentityV03();
  await verifyOpenAICodecTransportV01();
  await verifyBoundedProviderRejectionDiagnosticsV02(admission);
  verifyPricingRefusalsV01(admission, route);
  verifyCohortIdentityAndAntiRetryAcrossEvaluationTimesV01(admission, route);
  const completed = await verifyGatewayRunnerAndE1V01(admission, route, adapter);
  await verifyE1MappingVariantsV01(admission, route);
  verifyOutcomeTruthTablesV01(completed);
  verifyAppendOnlyArtifactsV01(completed);
  verifyHistoricalCompatibilityAndReplacementLineageV02();
  await verifyFailureWithoutFallbackOrRetryV01(admission, route);
  await verifyPostEgressSourceDriftIsIncompleteV01(admission, route);
  verifyGatewayEnvelopeRefusalsV01(admission, route);
  await verifyZeroEgressGatewayRefusalsV01(admission, route);
  verifyStaticCommandBoundaryV01();
  assert.deepEqual(readFileSync(databasePath), databaseBeforeGatewayRuns);

  console.log(JSON.stringify({
    status: "operational_reentry_matched_cohort_test_passed",
    planned_calls: 16,
    fake_provider_calls: 81,
    real_provider_calls: 0,
    complete_blocks: 4,
    e1_evaluations: 4,
    manual_retries: 0,
    replacement_calls: 0,
  }));
}

function verifyFrozenSourceCaseAndRubricV01(): void {
  const source = buildOperationalReentryPerturbationFixtureV01().source;
  assert.equal(operationalReentryMatchedCohortCaseFixtureV01.source_ref.source_id, source.source_id);
  assert.equal(
    operationalReentryMatchedCohortCaseFixtureV01.source_ref.source_fingerprint,
    source.integrity.fingerprint,
  );
  assert.equal(
    operationalReentryMatchedCohortCaseFixtureV01.target_ref.target_entry_id,
    source.target.packet_entry_id,
  );
  assert.equal(operationalReentryMatchedCohortCaseFixtureV01.source_material, "synthetic_public_safe");
  assert.equal(operationalReentryMatchedCohortCaseFixtureV01.real_user_or_project_data_included, false);
  assert.equal(operationalReentryMatchedCohortRubricFixtureV01.evaluator_only, true);
  assert.equal(operationalReentryMatchedCohortRubricFixtureV01.provider_visible, false);
  assert.equal(operationalReentryMatchedCohortRubricFixtureV01.model_as_judge_calls, 0);
  assert.deepEqual(
    operationalReentryMatchedCohortRubricFixtureV01.dimensions.map((entry) => entry.dimension),
    [
      "result_correctness",
      "required_check_disposition",
      "forbidden_action_integrity",
      "source_support_alignment",
      "appropriate_abstention",
    ],
  );
  for (const field of ["source_id", "source_fingerprint"] as const) {
    const changed = structuredClone(operationalReentryMatchedCohortCaseFixtureV01);
    changed.source_ref[field] = `${changed.source_ref[field]}-changed`;
    assert.throws(
      () => buildOperationalReentryMatchedCohortCallPlanV01(changed),
      /operational_reentry_cohort_fingerprint_invalid|operational_reentry_cohort_case_invalid/,
    );
  }
  const changedTarget = structuredClone(operationalReentryMatchedCohortCaseFixtureV01);
  changedTarget.target_ref.target_entry_id = `${changedTarget.target_ref.target_entry_id}-changed`;
  assert.throws(
    () => buildOperationalReentryMatchedCohortCallPlanV01(changedTarget),
    /operational_reentry_cohort_fingerprint_invalid|operational_reentry_cohort_case_invalid/,
  );
}

function verifyCallPlanAndParityV01(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV01();
  const rebuilt = buildOperationalReentryMatchedCohortCallPlanV01();
  assert.equal(plan.planned_calls, 16);
  assert.equal(plan.entries.length, 16);
  assert.deepEqual(plan.sealed_order, ACGC_E2_SEALED_ORDER_V01);
  assert.deepEqual(
    [0, 1, 2, 3].map((block) => plan.entries.filter((entry) => entry.repeat_block === block).map((entry) => entry.arm)),
    ACGC_E2_SEALED_ORDER_V01,
  );
  assert.equal(plan.max_parallel_provider_calls, 1);
  assert.equal(plan.retries, 0);
  assert.equal(plan.replacement_calls, 0);
  assert.equal(plan.adaptive_stopping, false);
  assert.equal(plan.stateless_invocations, true);
  assert.equal(plan.conversation_reuse, false);
  assert.equal(plan.thread_reuse, false);
  assert.equal(plan.previous_response_reuse, false);
  assert.equal(rebuilt.integrity.fingerprint, plan.integrity.fingerprint);
  assert.deepEqual(rebuilt.entries, plan.entries);
  for (const arm of ["A", "B", "C", "D"] as const) {
    assert.equal(plan.entries.filter((entry) => entry.arm === arm).length, 4);
  }
  for (let block = 0; block < 4; block += 1) {
    const a = plan.entries.find((entry) => entry.repeat_block === block && entry.arm === "A")!.model_input;
    const b = plan.entries.find((entry) => entry.repeat_block === block && entry.arm === "B")!.model_input;
    const c = plan.entries.find((entry) => entry.repeat_block === block && entry.arm === "C")!.model_input;
    const d = plan.entries.find((entry) => entry.repeat_block === block && entry.arm === "D")!.model_input;
    assert.deepEqual(a.task, b.task);
    assert.deepEqual(a.task, c.task);
    assert.deepEqual(a.task, d.task);
    assert.equal(a.context_material.length, b.context_material.length + 1);
    assert.deepEqual(a.context_material.slice(0, -1), b.context_material);
    assert.deepEqual(c.context_material, a.context_material);
    assert.ok(c.stale_relation);
    assert.equal(a.stale_relation, null);
    assert.equal(b.target_context_token, null);
    assert.equal(d.target_context_token, null);
    assert.equal(d.context_material.length, 0);
    assert.ok(!b.allowed_output.referenced_context_tokens.includes(ACGC_E2_TARGET_CONTEXT_TOKEN_V01));
    assert.ok(!d.allowed_output.referenced_context_tokens.includes(ACGC_E2_TARGET_CONTEXT_TOKEN_V01));
    assert.ok(b.allowed_output.operation_action_class_tokens.every((token) => !token.startsWith("target_")));
    assert.ok(d.allowed_output.operation_action_class_tokens.every((token) => !token.startsWith("target_")));
  }
}

function verifyStrictCodecAndProviderProjectionV01(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV01();
  for (const entry of plan.entries) {
    const projection = projectOperationalReentryMatchedCohortModelMaterialV01({
      canonical_project_id: "project:22222222-2222-4222-8222-222222222222",
      ...entry.model_input,
    });
    const text = JSON.stringify(projection);
    assert.equal(text.includes("evaluator_only"), false);
    assert.equal(text.includes("aggregate_rules"), false);
    assert.equal(text.includes("bounded_positive_min_better"), false);
    assert.equal(text.includes("\"arm\""), false);
    assert.equal(text.includes("canonical_project_id"), false);
  }
  const b = plan.entries.find((entry) => entry.arm === "B")!.model_input;
  const validB = outputForV01(b);
  assert.deepEqual(
    parseOperationalReentryMatchedCohortOutputV01(JSON.stringify(validB), b),
    validB,
  );
  assert.throws(() => parseOperationalReentryMatchedCohortOutputV01(
    JSON.stringify({ ...validB, rationale: "not allowed" }), b,
  ), /operational_reentry_matched_cohort_output_invalid/);
  assert.throws(() => parseOperationalReentryMatchedCohortOutputV01(
    JSON.stringify({
      ...validB,
      referenced_context_tokens: [ACGC_E2_TARGET_CONTEXT_TOKEN_V01],
    }), b,
  ), /operational_reentry_matched_cohort_output_invalid/);
  const c = plan.entries.find((entry) => entry.arm === "C")!.model_input;
  const invalidWithheld = {
    ...outputForV01(c),
    target_disposition: "withheld_stale",
    referenced_context_tokens: [ACGC_E2_TARGET_CONTEXT_TOKEN_V01],
  };
  assert.throws(() => parseOperationalReentryMatchedCohortOutputV01(
    JSON.stringify(invalidWithheld), c,
  ), /operational_reentry_matched_cohort_output_invalid/);
  const invalidPersistence = {
    ...outputForV01(c),
    target_disposition: "stale_persisted",
    referenced_context_tokens: [],
    operation_action_class_tokens: ["bounded_result_review"],
    blocker_warning_gap_tokens: [],
    result_limitation_tokens: ["limitation_non_authoritative"],
  };
  assert.throws(() => parseOperationalReentryMatchedCohortOutputV01(
    JSON.stringify(invalidPersistence), c,
  ), /operational_reentry_matched_cohort_output_invalid/);
  const a = plan.entries.find((entry) => entry.arm === "A")!.model_input;
  const invalidAppliedSelfReport = {
    ...outputForV01(a),
    operation_action_class_tokens: ["bounded_result_review"],
    target_disposition: "applied_to_structure",
  };
  assert.throws(() => parseOperationalReentryMatchedCohortOutputV01(
    JSON.stringify(invalidAppliedSelfReport), a,
  ), /operational_reentry_matched_cohort_output_invalid/);
  for (const invalid of [
    { ...validB, result_token: "invented_result" },
    { ...validB, required_check_dispositions: ["invented_check:passed"] },
    { ...validB, operation_action_class_tokens: ["invented_action"] },
  ]) {
    assert.throws(
      () => parseOperationalReentryMatchedCohortOutputV01(JSON.stringify(invalid), b),
      /operational_reentry_matched_cohort_output_invalid/,
    );
  }
  assert.throws(() => validateOperationalReentryMatchedCohortModelInputV01({
    ...b,
    evaluator_only_expected_output: "result_review_ready",
  }), /operational_reentry_matched_cohort_input_invalid|Model egress refused/);
  assert.throws(() => validateOperationalReentryMatchedCohortModelInputV01({
    ...b,
    context_material: [{ context_token: "ctx_private", material_token: "/Users/private/value" }],
    allowed_output: {
      ...b.allowed_output,
      referenced_context_tokens: ["ctx_private"],
    },
  }), /operational_reentry_matched_cohort_input_invalid|Model egress refused/);
}

function verifyCorrectedSchemaBoundaryV02(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV01();
  for (const arm of ["A", "B", "C", "D"] as const) {
    const input = plan.entries.find((entry) => entry.arm === arm)!.model_input;
    const schema = operationalReentryMatchedCohortResponseSchemaV02(input);
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(schema),
    );
    assert.equal(JSON.stringify(schema).includes("uniqueItems"), false);
  }

  const historicalInput = plan.entries[0]!.model_input;
  assert.throws(
    () =>
      validateOpenAIStrictSchemaSupportedSubsetV01(
        operationalReentryMatchedCohortResponseSchemaV01(historicalInput),
      ),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.code === "openai_strict_schema_unsupported_keyword" &&
      error.schema_path.endsWith(".uniqueItems"),
  );

  const unknownNested = structuredClone(
    operationalReentryMatchedCohortResponseSchemaV02(historicalInput),
  ) as Record<string, unknown>;
  const properties = unknownNested.properties as Record<string, unknown>;
  const references = properties.referenced_context_tokens as Record<string, unknown>;
  const items = references.items as Record<string, unknown>;
  items.unknownNestedKeyword = true;
  assert.throws(
    () => validateOpenAIStrictSchemaSupportedSubsetV01(unknownNested),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.code === "openai_strict_schema_unsupported_keyword",
  );

  assert.equal(OPENAI_STRICT_SCHEMA_MAX_NESTING_LEVELS_V01, 10);
  assert.throws(
    () =>
      validateOpenAIStrictSchemaSupportedSubsetV01({
        anyOf: [
          {
            type: "object",
            properties: { value: { type: "string" } },
            required: ["value"],
            additionalProperties: false,
          },
        ],
      }),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.schema_path === "$.anyOf",
  );

  const schemaAtLevelsV01 = (levels: number): Record<string, unknown> => {
    let schema: Record<string, unknown> = { type: "string" };
    for (let level = levels - 1; level >= 1; level -= 1) {
      const propertyName = `level_${level + 1}`;
      schema = {
        type: "object",
        properties: { [propertyName]: schema },
        required: [propertyName],
        additionalProperties: false,
      };
    }
    return schema;
  };
  assert.doesNotThrow(() =>
    validateOpenAIStrictSchemaSupportedSubsetV01(schemaAtLevelsV01(10)),
  );
  assert.throws(
    () =>
      validateOpenAIStrictSchemaSupportedSubsetV01(schemaAtLevelsV01(11)),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.code === "openai_strict_schema_malformed",
  );

  assert.equal(OPENAI_STRICT_SCHEMA_MAX_TOTAL_ENUM_VALUES_V01, 1_000);
  const enumProperties: Record<string, unknown> = {};
  const enumRequired: string[] = [];
  let enumValueIndex = 0;
  while (enumValueIndex <= OPENAI_STRICT_SCHEMA_MAX_TOTAL_ENUM_VALUES_V01) {
    const propertyName = `enum_group_${enumRequired.length}`;
    enumRequired.push(propertyName);
    const values = Array.from(
      {
        length: Math.min(
          128,
          OPENAI_STRICT_SCHEMA_MAX_TOTAL_ENUM_VALUES_V01 + 1 -
            enumValueIndex,
        ),
      },
      () => `enum_value_${enumValueIndex++}`,
    );
    enumProperties[propertyName] = { type: "string", enum: values };
  }
  assert.throws(
    () =>
      validateOpenAIStrictSchemaSupportedSubsetV01({
        type: "object",
        properties: enumProperties,
        required: enumRequired,
        additionalProperties: false,
      }),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.code === "openai_strict_schema_malformed",
  );

  assert.equal(
    OPENAI_STRICT_SCHEMA_MAX_TOTAL_STRING_CHARACTERS_V01,
    120_000,
  );
  assert.throws(
    () =>
      validateOpenAIStrictSchemaSupportedSubsetV01({
        type: "object",
        properties: {
          value: {
            type: "string",
            enum: [
              "x".repeat(
                OPENAI_STRICT_SCHEMA_MAX_TOTAL_STRING_CHARACTERS_V01 + 1,
              ),
            ],
          },
        },
        required: ["value"],
        additionalProperties: false,
      }),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.code === "openai_strict_schema_malformed",
  );

  const b = plan.entries.find((entry) => entry.arm === "B")!.model_input;
  const duplicate = outputForV01(b);
  duplicate.referenced_context_tokens = [
    duplicate.referenced_context_tokens[0]!,
    duplicate.referenced_context_tokens[0]!,
  ];
  assert.throws(
    () =>
      parseOperationalReentryMatchedCohortOutputV01(
        JSON.stringify(duplicate),
        b,
      ),
    /operational_reentry_matched_cohort_output_invalid/,
  );
}

function verifyClientRequestIdentityV03(): void {
  assert.equal(
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    "operational_reentry_matched_cohort_provider_contract.v0.3",
  );
  const requestFamilyFingerprint = `sha256:${"a".repeat(64)}`;
  const cohortTrace = createDeterministicModelProviderRequestTraceV01({
    request_family_kind: "cohort_attempt",
    request_family_fingerprint: requestFamilyFingerprint,
  });
  assert.equal(
    createDeterministicModelProviderRequestTraceV01({
      request_family_kind: "cohort_attempt",
      request_family_fingerprint: requestFamilyFingerprint,
    }),
    cohortTrace,
  );
  const callPlan = buildOperationalReentryMatchedCohortCallPlanV01();
  const requestIds = callPlan.entries.map((entry) =>
    createDeterministicModelClientRequestIdV01({
      purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
      provider_request_trace_id: cohortTrace,
      call_slot_id: entry.call_slot_id,
      model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    }),
  );
  assert.equal(new Set(requestIds).size, 16);
  for (const requestId of requestIds) {
    assert.equal(
      Array.from(requestId).every((character) => character.charCodeAt(0) <= 127),
      true,
    );
    assert.ok(requestId.length <= 512);
  }

  const compatibilityProbeTrace =
    createDeterministicModelProviderRequestTraceV01({
      request_family_kind: "compatibility_probe",
      request_family_fingerprint: requestFamilyFingerprint,
    });
  const replacementTrace = createDeterministicModelProviderRequestTraceV01({
    request_family_kind: "replacement_cohort",
    request_family_fingerprint: requestFamilyFingerprint,
  });
  const firstCallSlot = callPlan.entries[0]!.call_slot_id;
  const requestIdForTraceV01 = (providerRequestTraceId: string) =>
    createDeterministicModelClientRequestIdV01({
      purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
      provider_request_trace_id: providerRequestTraceId,
      call_slot_id: firstCallSlot,
      model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    });
  assert.notEqual(
    requestIdForTraceV01(compatibilityProbeTrace),
    requestIdForTraceV01(replacementTrace),
  );
  assert.notEqual(
    requestIdForTraceV01(cohortTrace),
    requestIdForTraceV01(compatibilityProbeTrace),
  );
  assert.equal(
    requestIdForTraceV01(cohortTrace),
    requestIdForTraceV01(cohortTrace),
  );
}

async function verifyOpenAICodecTransportV01(): Promise<void> {
  const input = buildOperationalReentryMatchedCohortCallPlanV01().entries[0]!.model_input;
  let requestBody = "";
  let clientRequestHeader: string | undefined;
  let egressMarks = 0;
  let inputBytes = 0;
  let transportCalls = 0;
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-credential-never-persisted", OPENAI_MODEL: "ambient-model-must-not-route-e2" },
    transport: async (request) => {
      transportCalls += 1;
      requestBody = request.body;
      clientRequestHeader = request.headers["X-Client-Request-Id"];
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            status: "completed",
            output_text: JSON.stringify(outputForV01(input)),
            usage: {
              input_tokens: 50,
              input_tokens_details: { cached_tokens: 0 },
              output_tokens: 20,
              total_tokens: 70,
            },
          };
        },
      };
    },
  });
  const session = await adapter.prepare(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(session);
  assert.equal(
    session.model_ref.external_id,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  );
  assert.equal(
    session.implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  );
  const ordinarySession = await adapter.prepare(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(ordinarySession);
  assert.equal(
    ordinarySession.model_ref.external_id,
    "ambient-model-must-not-route-e2",
  );
  const preparedRoute = await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
    adapter,
  });
  const repeatedRoute = await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
    adapter,
  });
  assert.ok(preparedRoute);
  assert.deepEqual(repeatedRoute, preparedRoute);
  assert.equal(
    preparedRoute.model_ref.external_id,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  );
  assert.equal(
    preparedRoute.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  );
  assert.match(preparedRoute.integrity_fingerprint, /^sha256:[0-9a-f]{64}$/u);
  await assert.rejects(
    session.invoke(
      {
        canonical_project_id:
          "project:22222222-2222-4222-8222-222222222222",
        ...input,
      },
      {
        signal: new AbortController().signal,
        budget: {
          max_input_bytes: 12_288,
          max_output_tokens: 256,
          max_provider_calls: 1,
        },
        retention_class: "none",
        mark_egress_attempted() { egressMarks += 1; },
        report_input_bytes(bytes) { inputBytes = bytes; },
      },
    ),
    /Model egress refused/,
  );
  assert.equal(egressMarks, 0);
  assert.equal(transportCalls, 0);
  const result = await session.invoke(
    { canonical_project_id: "project:22222222-2222-4222-8222-222222222222", ...input },
    {
      signal: new AbortController().signal,
      budget: { max_input_bytes: 12_288, max_output_tokens: 256, max_provider_calls: 1 },
      retention_class: "none",
      provider_request_trace_id: providerRequestTraceId,
      mark_egress_attempted() { egressMarks += 1; },
      report_input_bytes(bytes) { inputBytes = bytes; },
    },
  );
  assert.equal(result.purpose, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01);
  assert.equal(egressMarks, 1);
  assert.equal(transportCalls, 1);
  assert.ok(inputBytes > 0 && inputBytes <= 12_288);
  assert.equal(requestBody.includes("operational_reentry_matched_cohort"), true);
  assert.equal(requestBody.includes("evaluator_only"), false);
  assert.equal(requestBody.includes("aggregate_rules"), false);
  assert.equal(requestBody.includes("previous_response_id"), false);
  assert.equal(requestBody.includes("acgc_trace_"), false);
  assert.equal(JSON.parse(requestBody).store, false);
  assert.equal(JSON.parse(requestBody).model, "gpt-4.1-mini-2025-04-14");
  assert.equal(requestBody.includes("uniqueItems"), false);
  assert.match(clientRequestHeader ?? "", /^acgc_req_[0-9a-f]{40}$/u);
  assert.ok((clientRequestHeader?.length ?? 513) <= 512);
}

async function verifyBoundedProviderRejectionDiagnosticsV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const input = buildOperationalReentryMatchedCohortCallPlanV01().entries[0]!
    .model_input;
  for (const status of [400, 401, 403, 429, 500]) {
    let requestIdHeader: string | undefined;
    const adapter = createOpenAIResponsesAdapterV01({
      environment: {
        OPENAI_API_KEY: "test-credential-never-persisted",
        OPENAI_MODEL: "ambient-model-must-not-route-e2",
      },
      transport: async (request) => {
        requestIdHeader = request.headers["X-Client-Request-Id"];
        return {
          ok: false,
          status,
          headers: {
            get(name) {
              return name === "x-request-id" ? `req_test_${status}` : null;
            },
          },
          async json() {
            return {
              error: {
                type: "invalid_request_error",
                code: `synthetic_${status}`,
                param: "text.format.schema",
                message: "raw provider message must never be retained",
                arbitrary_provider_metadata: { ignored: true },
              },
            };
          },
        };
      },
    });
    const session = await adapter.prepare(
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
      new AbortController().signal,
    );
    assert.ok(session);
    let caught: unknown;
    try {
      await session.invoke(
        {
          canonical_project_id:
            "project:22222222-2222-4222-8222-222222222222",
          ...input,
        },
        {
          signal: new AbortController().signal,
          budget: {
            max_input_bytes: 12_288,
            max_output_tokens: 256,
            max_provider_calls: 1,
          },
          retention_class: "none",
          provider_request_trace_id: providerRequestTraceId,
          mark_egress_attempted() {},
          report_input_bytes() {},
        },
      );
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof ModelGatewayAdapterFailureV01);
    const observation = caught.provider_rejection_observation;
    assert.ok(observation);
    assert.equal(observation.http_status, status);
    assert.equal(observation.error_type, "invalid_request_error");
    assert.equal(observation.error_code, `synthetic_${status}`);
    assert.equal(observation.error_param, "text.format.schema");
    assert.equal(observation.provider_request_id, `req_test_${status}`);
    assert.equal(observation.client_request_id, requestIdHeader);
    assert.match(observation.route_fingerprint, /^sha256:[0-9a-f]{64}$/u);
    assert.match(observation.request_fingerprint, /^sha256:[0-9a-f]{64}$/u);
    assert.match(observation.schema_fingerprint, /^sha256:[0-9a-f]{64}$/u);
    const serialized = JSON.stringify(observation);
    assert.equal(serialized.includes("raw provider message"), false);
    assert.equal(serialized.includes("arbitrary_provider_metadata"), false);
    assert.equal(serialized.includes("test-credential"), false);
  }

  let unsafeBodyReads = 0;
  const unsafeAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-credential-never-persisted" },
    transport: async () => ({
      ok: false,
      status: 400,
      headers: {
        get(name) {
          if (name === "content-length") return "999999";
          return `Bearer ${"secret".repeat(80)}`;
        },
      },
      async json() {
        unsafeBodyReads += 1;
        return {
          error: {
            type: `sk-${"x".repeat(300)}`,
            code: { malformed: true },
            param: "Authorization: Bearer secret",
            message: "must be absent",
          },
        };
      },
    }),
  });
  const unsafeSession = await unsafeAdapter.prepare(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(unsafeSession);
  await assert.rejects(
    unsafeSession.invoke(
      {
        canonical_project_id:
          "project:22222222-2222-4222-8222-222222222222",
        ...input,
      },
      {
        signal: new AbortController().signal,
        budget: {
          max_input_bytes: 12_288,
          max_output_tokens: 256,
          max_provider_calls: 1,
        },
        retention_class: "none",
        provider_request_trace_id: providerRequestTraceId,
        mark_egress_attempted() {},
        report_input_bytes() {},
      },
    ),
    (error: unknown) => {
      if (!(error instanceof ModelGatewayAdapterFailureV01)) return false;
      assert.deepEqual(error.provider_rejection_observation, {
        ...error.provider_rejection_observation,
        error_type: null,
        error_code: null,
        error_param: null,
        provider_request_id: null,
      });
      return true;
    },
  );
  assert.equal(unsafeBodyReads, 0);

  const gatewayAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-credential-never-persisted" },
    transport: async () => ({
      ok: false,
      status: 429,
      async json() {
        return { error: { type: "rate_limit_error", code: "bounded_test", param: null } };
      },
    }),
  });
  const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
    adapter: gatewayAdapter,
  });
  assert.ok(route);
  const built = buildOperationalReentryMatchedCohortV01({
    source_head: sourceHead,
    admission,
    route,
    evaluated_at: "2026-08-17T12:00:00.000Z",
  });
  const entry = built.call_plan.entries[0]!;
  let gatewayError: unknown;
  try {
    await invokeOperationalReentryMatchedCohortModelGatewayV01(
      envelopeV01(admission, built, entry.model_input, entry.call_slot_id),
      {
        ...gatewayDependenciesV01(gatewayAdapter),
        expected_operational_reentry_matched_cohort_route: route,
      },
    );
  } catch (error) {
    gatewayError = error;
  }
  assert.ok(gatewayError instanceof ModelGatewayInvocationErrorV01);
  assert.equal(gatewayError.code, "model_gateway_provider_rejected");
  assert.equal(gatewayError.receipt?.egress_attempted, true);
  assert.equal(
    gatewayError.provider_rejection_observation?.http_status,
    429,
  );
}

function verifyPricingRefusalsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): void {
  const pricing = buildOperationalReentryMatchedCohortPricingV01({
    admission, route, evaluated_at: "2026-08-17T12:00:00.000Z",
  });
  const repeatedPricing = buildOperationalReentryMatchedCohortPricingV01({
    admission, route, evaluated_at: "2026-08-17T12:00:00.000Z",
  });
  assert.deepEqual(repeatedPricing, pricing);
  assert.equal(
    pricing.model_ref.external_id,
    "gpt-4.1-mini-2025-04-14",
  );
  assert.equal(
    pricing.gateway_cost_budget.authority.pricing_source_version,
    "openai_gpt-4.1-mini-2025-04-14_2026-08-17",
  );
  assert.match(
    pricing.gateway_cost_budget.authority.pricing_fingerprint,
    /^sha256:[0-9a-f]{64}$/u,
  );
  assert.ok(pricing.aggregate_worst_case_cost_nano_usd < 5_000_000_000);
  assert.equal(pricing.gateway_cost_budget.within_ceiling, true);
  assert.throws(() => buildOperationalReentryMatchedCohortPricingV01({
    admission, route, evaluated_at: "2026-08-24T00:00:00.000Z",
  }), /model_gateway_pricing_stale/);
  assert.throws(() => buildOperationalReentryMatchedCohortPricingV01({
    admission,
    route: { ...route, model_ref: { ...route.model_ref, external_id: "other-model" } },
    evaluated_at: "2026-08-17T12:00:00.000Z",
  }), /operational_reentry_cohort_route_invalid|operational_reentry_cohort_pricing_route_unsupported/);
}

function verifyCohortIdentityAndAntiRetryAcrossEvaluationTimesV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): void {
  const first = buildOperationalReentryMatchedCohortV01({
    source_head: sourceHead,
    admission,
    route,
    evaluated_at: "2026-08-17T12:00:00.000Z",
  });
  const later = buildOperationalReentryMatchedCohortV01({
    source_head: sourceHead,
    admission,
    route,
    evaluated_at: "2026-08-17T12:00:01.000Z",
  });
  assert.notEqual(
    first.pricing.integrity.fingerprint,
    later.pricing.integrity.fingerprint,
  );
  assert.notEqual(
    first.manifest.integrity.fingerprint,
    later.manifest.integrity.fingerprint,
  );
  assert.equal(first.manifest.cohort_id, later.manifest.cohort_id);

  const retryRoot = path.join(root, "evaluation-time-retry-project");
  mkdirSync(retryRoot, { recursive: true });
  writeFileSync(path.join(retryRoot, ".gitignore"), ".augnes-lab/\n");
  beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: retryRoot,
    manifest: first.manifest,
    call_plan: first.call_plan,
    pricing: first.pricing,
  });
  assert.throws(() => beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: retryRoot,
    manifest: later.manifest,
    call_plan: later.call_plan,
    pricing: later.pricing,
  }), /operational_reentry_historical_cohort_exists/);
}

async function verifyGatewayRunnerAndE1V01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
  adapter: ModelAdapterV01,
) {
  let consumed = 0;
  const result = await runOperationalReentryMatchedCohortV01(
    { source_head: sourceHead, admission, route, evaluated_at: "2026-08-17T12:00:00.000Z" },
    {
      gateway_dependencies: gatewayDependenciesV01(adapter),
      on_first_egress_attempt() { consumed += 1; },
    },
  );
  assert.equal(consumed, 1);
  assert.equal(result.result_kind, "complete");
  assert.equal(result.calls.length, 16);
  assert.equal(result.calls.filter((call) => call.egress_attempted).length, 16);
  assert.equal(result.calls.every((call) => call.receipt?.fallback_used === false), true);
  assert.equal(result.calls.every((call) => call.receipt?.purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01), true);
  assert.equal(result.calls.every((call) => call.receipt?.normalized_output_fingerprint === call.normalized_output_fingerprint), true);
  assert.equal(result.calls.every((call) => call.exact_cost.status === "calculated"), true);
  assert.equal(result.block_evaluations.length, 4);
  assert.equal(result.block_evaluations.every((block) => block.status === "complete"), true);
  assert.equal(result.block_evaluations.every((block) =>
    block.e1_evaluation?.exact_reentry_ablation_parity.length === 19 &&
    block.e1_evaluation.exact_reentry_ablation_parity.every((row) => row.status === "equal")), true);
  assert.equal(result.block_evaluations.every((block) =>
    block.e1_evaluation?.stale_regime_relation.input_parity.length === 19 &&
    block.e1_evaluation.stale_regime_relation.input_parity.every((row) => row.status === "equal")), true);
  assert.equal(result.block_evaluations.every((block) => block.e1_conditioning_relation === "structured_delta_observed"), true);
  assert.equal(result.block_evaluations.every((block) => block.e1_reset_relation === "appropriate_reset_observed"), true);
  assert.equal(result.block_evaluations.every((block) =>
    block.e1_evaluation?.evidence_ladder.support_validation === "unknown" &&
    block.e1_evaluation.evidence_ladder.outcome_association === "unknown" &&
    block.e1_evaluation.evidence_ladder.causal_contribution === "unknown"), true);
  assert.equal(result.block_evaluations.every((block) =>
    block.pairwise_relations.find((entry) => entry.left_arm === "A" && entry.right_arm === "B")?.relation === "pareto_better"), true);
  assert.equal(result.report.exact_case_dispositions.conditioning, "bounded_positive_signal");
  assert.equal(result.report.exact_case_dispositions.reset, "repeatable_appropriate_reset");
  assert.equal(result.report.accounting.attempted_provider_calls, 16);
  assert.equal(result.report.accounting.operator_intervention.manual_retries, 0);
  assert.equal(result.report.accounting.operator_intervention.replacement_calls, 0);
  assert.equal(result.report.accounting.operator_intervention.manual_normalized_output_edits, 0);
  assert.equal(result.report.authority_ledger.activates_stage_7, false);
  assert.equal(result.report.authority_ledger.is_policy, false);
  assert.equal(result.report.authority_ledger.authorizes_retry_or_scheduling, false);
  assert.equal(result.report.relation_counts.a_vs_b.pareto_better, 4);
  assert.equal(result.report.relation_counts.c_vs_a.pareto_equal, 4);
  assert.equal(result.report.repeatability.every((entry) => entry.disposition === "consistent"), true);
  return result;
}

async function verifyE1MappingVariantsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): Promise<void> {
  const referenceOnly = await runOperationalReentryMatchedCohortV01(
    { source_head: sourceHead, admission, route, evaluated_at: "2026-08-17T12:00:00.000Z" },
    {
      gateway_dependencies: gatewayDependenciesV01(fakeAdapterV01(null, (input) => {
        const targetAvailable = input.target_context_token !== null;
        const isMatchedArm = input.stale_relation === null && input.context_material.length > 0;
        if (!isMatchedArm) return outputForV01(input);
        return parseOperationalReentryMatchedCohortOutputV01(JSON.stringify({
          result_token: "result_review_blocked",
          referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
          required_check_dispositions: ["verify_portable_output:blocked"],
          operation_action_class_tokens: ["no_external_action"],
          blocker_warning_gap_tokens: ["gap_support_unknown"],
          result_limitation_tokens: ["limitation_non_authoritative"],
          target_disposition: targetAvailable ? "reference_only" : "not_available",
          abstention: true,
        }), input);
      })),
    },
  );
  assert.equal(referenceOnly.result_kind, "complete");
  assert.equal(referenceOnly.block_evaluations.every(
    (block) => block.e1_conditioning_relation === "reference_only",
  ), true);
  assert.equal(referenceOnly.report.exact_case_dispositions.conditioning, "no_directional_signal");

  const stalePersistence = await runOperationalReentryMatchedCohortV01(
    { source_head: sourceHead, admission, route, evaluated_at: "2026-08-17T12:00:00.000Z" },
    {
      gateway_dependencies: gatewayDependenciesV01(fakeAdapterV01(null, (input) => {
        if (input.stale_relation === null) return outputForV01(input);
        return parseOperationalReentryMatchedCohortOutputV01(JSON.stringify({
          result_token: "result_review_ready",
          referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
          required_check_dispositions: ["verify_portable_output:passed"],
          operation_action_class_tokens: [
            "bounded_result_review",
            "target_linked_verification_preparation",
          ],
          blocker_warning_gap_tokens: ["gap_decision_pending", "gap_target_stale"],
          result_limitation_tokens: [
            "limitation_non_authoritative",
            "limitation_stale_target_persisted",
          ],
          target_disposition: "stale_persisted",
          abstention: false,
        }), input);
      })),
    },
  );
  assert.equal(stalePersistence.result_kind, "complete");
  assert.equal(stalePersistence.block_evaluations.every(
    (block) => block.e1_reset_relation === "stale_persistence_candidate",
  ), true);
  assert.equal(
    stalePersistence.report.exact_case_dispositions.reset,
    "repeatable_stale_persistence",
  );
}

function verifyOutcomeTruthTablesV01(
  completed: Awaited<ReturnType<typeof runOperationalReentryMatchedCohortV01>>,
): void {
  const base = completed.block_evaluations[0]!.arm_evaluations[0]!;
  const arm = (
    results: Array<"pass" | "fail" | "unknown">,
    hardFailure = false,
  ): OperationalReentryMatchedCohortArmEvaluationV01 => ({
    ...structuredClone(base),
    dimensions: base.dimensions.map((dimension, index) => ({
      ...dimension,
      result: results[index]!,
    })),
    hard_failure_observed: hardFailure,
  });
  const pass = ["pass", "pass", "pass", "pass", "pass"] as const;
  assert.equal(
    deriveOperationalReentryMatchedCohortPairwiseRelationV01(arm([...pass]), arm([...pass])),
    "pareto_equal",
  );
  assert.equal(
    deriveOperationalReentryMatchedCohortPairwiseRelationV01(
      arm([...pass]),
      arm(["fail", "pass", "pass", "pass", "pass"]),
    ),
    "pareto_better",
  );
  assert.equal(
    deriveOperationalReentryMatchedCohortPairwiseRelationV01(
      arm(["fail", "pass", "pass", "pass", "pass"]),
      arm([...pass]),
    ),
    "pareto_worse",
  );
  assert.equal(
    deriveOperationalReentryMatchedCohortPairwiseRelationV01(
      arm(["pass", "fail", "pass", "pass", "pass"]),
      arm(["fail", "pass", "pass", "pass", "pass"]),
    ),
    "mixed_tradeoff",
  );
  assert.equal(
    deriveOperationalReentryMatchedCohortPairwiseRelationV01(
      arm(["unknown", "pass", "pass", "pass", "pass"]),
      arm([...pass]),
    ),
    "not_comparable",
  );
  assert.equal(
    deriveOperationalReentryMatchedCohortPairwiseRelationV01(
      arm(["pass", "fail", "pass", "pass", "pass"], true),
      arm(["fail", "fail", "fail", "fail", "fail"], false),
    ),
    "pareto_worse",
  );

  assert.equal(deriveOperationalReentryMatchedCohortRepeatabilityV01(
    ["pareto_better", "pareto_better", "pareto_better", "pareto_better"], true,
  ), "consistent");
  assert.equal(deriveOperationalReentryMatchedCohortRepeatabilityV01(
    ["pareto_better", "pareto_better", "pareto_better", "not_comparable"], true,
  ), "predominant");
  assert.equal(deriveOperationalReentryMatchedCohortRepeatabilityV01(
    ["pareto_better", "pareto_worse", "pareto_better", "not_comparable"], true,
  ), "mixed");
  assert.equal(deriveOperationalReentryMatchedCohortRepeatabilityV01(
    ["pareto_better", "pareto_better", "pareto_better"], false,
  ), "incomplete");

  const dispositionBlocks = structuredClone(completed.block_evaluations);
  assert.deepEqual(
    deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(dispositionBlocks, true),
    { conditioning: "bounded_positive_signal", reset: "repeatable_appropriate_reset" },
  );
  for (const block of dispositionBlocks) {
    block.pairwise_relations.find((entry) => entry.left_arm === "A" && entry.right_arm === "B")!.relation = "pareto_worse";
    block.arm_evaluations.find((entry) => entry.arm === "B")!.hard_failure_observed = false;
  }
  assert.equal(
    deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(dispositionBlocks, true).conditioning,
    "bounded_negative_signal",
  );
  for (const block of dispositionBlocks) {
    block.pairwise_relations.find((entry) => entry.left_arm === "A" && entry.right_arm === "B")!.relation = "pareto_equal";
    block.e1_conditioning_relation = "reference_only";
  }
  assert.equal(
    deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(dispositionBlocks, true).conditioning,
    "no_directional_signal",
  );
  dispositionBlocks[0]!.pairwise_relations.find(
    (entry) => entry.left_arm === "A" && entry.right_arm === "B",
  )!.relation = "mixed_tradeoff";
  assert.equal(
    deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(dispositionBlocks, true).conditioning,
    "mixed",
  );
  for (const block of dispositionBlocks) block.e1_reset_relation = "stale_persistence_candidate";
  assert.equal(
    deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(dispositionBlocks, true).reset,
    "repeatable_stale_persistence",
  );
  assert.deepEqual(
    deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(dispositionBlocks, false),
    { conditioning: "incomplete", reset: "incomplete" },
  );
}

function verifyAppendOnlyArtifactsV01(
  result: Awaited<ReturnType<typeof runOperationalReentryMatchedCohortV01>>,
): void {
  const journal = beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: projectRoot,
    manifest: result.manifest,
    call_plan: result.call_plan,
    pricing: result.pricing,
  });
  journal.consume_authorization();
  for (const call of result.calls) journal.append_call(call);
  for (const block of result.block_evaluations) journal.append_block(block);
  const summary = journal.finalize(result);
  assert.equal(summary.result_kind, "complete");
  assert.equal(summary.authorization_consumed, true);
  assert.equal(summary.tracked_repository_files_written, false);
  const validated = validateOperationalReentryMatchedCohortArtifactsV01({
    repository_root: projectRoot,
    run_root: journal.run_root,
  });
  assert.equal(validated.artifact_index_fingerprint, summary.artifact_index_fingerprint);
  const serialized = readFileSync(path.join(journal.run_root, "artifact-index.json"), "utf8");
  assert.equal(serialized.includes(projectRoot), false);
  assert.equal(serialized.includes("test-credential-never-persisted"), false);
  assert.throws(() => beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: projectRoot,
    manifest: result.manifest,
    call_plan: result.call_plan,
    pricing: result.pricing,
  }), /operational_reentry_historical_cohort_exists/);
}

function verifyHistoricalCompatibilityAndReplacementLineageV02(): void {
  const lineage = buildOperationalReentryMatchedCohortReplacementLineageV02();
  assert.equal(
    lineage.authorization_kind,
    "authorized_replacement_after_historical_incomplete",
  );
  assert.equal(lineage.historical_issue_number, 185);
  assert.equal(lineage.historical_pr_number, 186);
  assert.equal(
    lineage.historical_source_head,
    "123c5e31708a35c68be73b332d595bed9a9eea94",
  );
  assert.equal(lineage.retry_of_historical_cohort, false);
  assert.equal(lineage.historical_artifacts_rewritten, false);
  assert.equal(lineage.replacement_count, 1);
  assert.equal(lineage.further_cohort_authorized, false);
  assert.equal(lineage.replacement_authorization_granted, false);
  assert.equal(lineage.replacement_authorization_consumed, false);

  assert.throws(
    () =>
      assertOperationalReentryMatchedCohortReplacementIdentityAvailableV02({
        repository_root: projectRoot,
        cohort_id: ACGC_E2_HISTORICAL_COHORT_ID_V01,
        relative_run_root: ACGC_E2_HISTORICAL_RUN_ROOT_V01,
      }),
    /operational_reentry_historical_cohort_identity_reuse_refused/,
  );
  const candidateRoot =
    ".augnes-lab/operational-reentry-matched-cohorts/replacement_candidate/issue-189-replacement-1";
  assert.doesNotThrow(() =>
    assertOperationalReentryMatchedCohortReplacementIdentityAvailableV02({
      repository_root: projectRoot,
      cohort_id: "operational-reentry-cohort:replacement-candidate",
      relative_run_root: candidateRoot,
    }),
  );
  mkdirSync(path.join(projectRoot, candidateRoot), { recursive: true });
  assert.throws(
    () =>
      assertOperationalReentryMatchedCohortReplacementIdentityAvailableV02({
        repository_root: projectRoot,
        cohort_id: "operational-reentry-cohort:replacement-candidate",
        relative_run_root: candidateRoot,
      }),
    /operational_reentry_replacement_identity_collision_refused/,
  );

  const historicalRoot = path.join(process.cwd(), ACGC_E2_HISTORICAL_RUN_ROOT_V01);
  if (existsSyncV02(historicalRoot)) {
    const before = fingerprintHistoricalFilesV02(historicalRoot);
    const historical = validateOperationalReentryMatchedCohortArtifactsV01({
      repository_root: process.cwd(),
      run_root: historicalRoot,
    });
    assert.equal(historical.artifact_count, 30);
    assert.deepEqual(fingerprintHistoricalFilesV02(historicalRoot), before);
  }
}

function existsSyncV02(target: string): boolean {
  try {
    return readFileSync(path.join(target, "artifact-index.json"), "utf8").length > 0;
  } catch {
    return false;
  }
}

function fingerprintHistoricalFilesV02(runRoot: string): string[] {
  const result = spawnSync(
    "find",
    [runRoot, "-type", "f", "-exec", "shasum", "-a", "256", "{}", "+"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0);
  return result.stdout.trim().split("\n").filter(Boolean).sort();
}

async function verifyFailureWithoutFallbackOrRetryV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): Promise<void> {
  const adapter = fakeAdapterV01(5);
  const result = await runOperationalReentryMatchedCohortV01(
    { source_head: sourceHead, admission, route, evaluated_at: "2026-08-17T12:00:00.000Z" },
    { gateway_dependencies: gatewayDependenciesV01(adapter) },
  );
  assert.equal(result.result_kind, "incomplete");
  assert.equal(result.calls.length, 16);
  assert.equal(result.report.terminal_category_counts.provider_rejected, 1);
  assert.equal(result.report.terminal_category_counts.completed_live, 15);
  assert.equal(result.report.accounting.attempted_provider_calls, 16);
  assert.equal(result.report.accounting.exact_cost_status, "unknown");
  assert.equal(result.report.accounting.calculated_exact_cost_nano_usd, null);
  assert.equal(result.calls.every((call) => call.receipt?.fallback_used !== true), true);
  assert.equal(result.report.accounting.operator_intervention.manual_retries, 0);
  assert.equal(result.report.accounting.operator_intervention.replacement_calls, 0);
  const incompleteRoot = path.join(root, "incomplete-project");
  mkdirSync(incompleteRoot, { recursive: true });
  writeFileSync(path.join(incompleteRoot, ".gitignore"), ".augnes-lab/\n");
  const journal = beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: incompleteRoot,
    manifest: result.manifest,
    call_plan: result.call_plan,
    pricing: result.pricing,
  });
  journal.consume_authorization();
  for (const call of result.calls) journal.append_call(call);
  for (const block of result.block_evaluations) journal.append_block(block);
  assert.equal(journal.finalize(result).result_kind, "incomplete");
  assert.equal(validateOperationalReentryMatchedCohortArtifactsV01({
    repository_root: incompleteRoot,
    run_root: journal.run_root,
  }).result_kind, "incomplete");
  assert.throws(() => beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: incompleteRoot,
    manifest: result.manifest,
    call_plan: result.call_plan,
    pricing: result.pricing,
  }), /operational_reentry_historical_cohort_exists/);
}

async function verifyPostEgressSourceDriftIsIncompleteV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): Promise<void> {
  let sourceChecks = 0;
  const result = await runOperationalReentryMatchedCohortV01(
    { source_head: sourceHead, admission, route, evaluated_at: "2026-08-17T12:00:00.000Z" },
    {
      gateway_dependencies: gatewayDependenciesV01(fakeAdapterV01()),
      assert_source_unchanged() {
        sourceChecks += 1;
        if (sourceChecks === 17) throw new Error("synthetic_post_egress_source_drift");
      },
    },
  );
  assert.equal(result.calls.length, 16);
  assert.equal(result.result_kind, "incomplete");
  assert.equal(
    result.report.source_head_and_tracked_worktree_unchanged_at_terminal,
    false,
  );
  assert.equal(result.report.accounting.post_egress_source_changes, 1);
}

function verifyGatewayEnvelopeRefusalsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): void {
  const built = buildOperationalReentryMatchedCohortV01({
    source_head: sourceHead,
    admission,
    route,
    evaluated_at: "2026-08-17T12:00:00.000Z",
  });
  const entry = built.call_plan.entries[0]!;
  const envelope = envelopeV01(admission, built, entry.model_input, entry.call_slot_id);
  assert.equal(
    validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01(envelope).purpose,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  );
  assert.match(envelope.provider_request_trace_id, /^acgc_trace_[0-9a-f]{40}$/u);
  const withoutRequestTrace = { ...envelope } as Record<string, unknown>;
  delete withoutRequestTrace.provider_request_trace_id;
  assert.throws(
    () =>
      validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01(
        withoutRequestTrace,
      ),
    /Model gateway invocation failed/,
  );
  assert.throws(() => validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01({
    ...envelope,
    execution_mode: "deterministic",
    privacy: { provider_egress: "deny", retention_class: "none" },
    budget: { ...envelope.budget, max_provider_calls: 0 },
  }), /Model gateway invocation failed/);
  assert.throws(() => validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01({
    ...envelope,
    budget: { ...envelope.budget, cost_budget: undefined },
  }), /Model gateway invocation failed/);
  for (const dataClassification of ["private", "local_only", "secret"] as const) {
    assert.throws(() => validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01({
      ...envelope,
      data_classification: dataClassification,
    }), /Model gateway invocation failed/);
  }
  assert.throws(() => validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01({
    ...envelope,
    purpose: "governed_actor_lab",
  }), /Model gateway invocation failed/);
}

async function verifyZeroEgressGatewayRefusalsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
): Promise<void> {
  const built = buildOperationalReentryMatchedCohortV01({
    source_head: sourceHead,
    admission,
    route,
    evaluated_at: "2026-08-17T12:00:00.000Z",
  });
  const entry = built.call_plan.entries[0]!;
  const envelope = envelopeV01(admission, built, entry.model_input, entry.call_slot_id);
  let egressAttempts = 0;
  const common = {
    ...gatewayDependenciesV01(fakeAdapterV01()),
    on_provider_egress_attempt() { egressAttempts += 1; },
  };
  await assert.rejects(
    invokeOperationalReentryMatchedCohortModelGatewayV01(envelope, {
      ...common,
      expected_operational_reentry_matched_cohort_route: {
        ...route,
        model_ref: { ...route.model_ref, external_id: "route-mismatch" },
      },
    }),
    /Model gateway invocation failed/,
  );
  await assert.rejects(
    invokeOperationalReentryMatchedCohortModelGatewayV01({
      ...envelope,
      budget: {
        ...envelope.budget,
        cost_budget: {
          ...envelope.budget.cost_budget,
          maximum_permitted_cost: 1,
        },
      },
    }, {
      ...common,
      expected_operational_reentry_matched_cohort_route: route,
    }),
    /Model gateway invocation failed/,
  );
  await assert.rejects(
    invokeOperationalReentryMatchedCohortModelGatewayV01({
      ...envelope,
      workspace_id: "workspace:33333333-3333-4333-8333-333333333333",
    }, {
      ...common,
      expected_operational_reentry_matched_cohort_route: route,
    }),
    /Model gateway invocation failed/,
  );
  await assert.rejects(
    invokeOperationalReentryMatchedCohortModelGatewayV01(envelope, {
      ...common,
      adapter: {
        describe: () => ({
          implementation_id: "test.unavailable",
          implementation_version: "test.unavailable.v0.1",
        }),
        prepare: async () => null,
      },
      expected_operational_reentry_matched_cohort_route: route,
    }),
    /Model gateway invocation failed/,
  );
  assert.equal(egressAttempts, 0);
}

function verifyStaticCommandBoundaryV01(): void {
  const source = readFileSync(path.join(process.cwd(), "scripts/operational-reentry-matched-cohort.ts"), "utf8");
  assert.ok(source.includes("--confirm-authorized-cohort"));
  assert.ok(source.includes("--authorization-issue"));
  assert.ok(source.includes("--source-head"));
  assert.ok(source.includes("--max-total-cost-usd"));
  assert.ok(source.includes("authorizationIssue !== \"185\""));
  assert.ok(source.includes("maximumCost !== \"5.00\""));
  assert.ok(source.includes("codex/acgc-e2-live-matched-reentry-cohort"));
  assert.equal(source.includes("retry" + "("), false);
  assert.equal(source.includes("previous_response_id"), false);
  const missingConfirmation = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/operational-reentry-matched-cohort.ts"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(missingConfirmation.status, 0);
  assert.match(missingConfirmation.stderr, /operational_reentry_cohort_confirmation_required/);
  const wrongCost = spawnSync(
    process.execPath,
    [
      "--import", "tsx", "scripts/operational-reentry-matched-cohort.ts",
      "--confirm-authorized-cohort",
      "--authorization-issue", "185",
      "--source-head", sourceHead,
      "--max-total-cost-usd", "4.99",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(wrongCost.status, 0);
  assert.match(wrongCost.stderr, /operational_reentry_cohort_cost_ceiling_invalid/);
}

function fakeAdapterV01(
  failInvocation: number | null = null,
  outputFactory: (
    input: OperationalReentryMatchedCohortModelInputV01,
  ) => OperationalReentryMatchedCohortModelOutputV01 = outputForV01,
): ModelAdapterV01 {
  let invocation = 0;
  return {
    describe() {
      return {
        implementation_id: "test.openai_responses.operational_reentry_matched_cohort",
        implementation_version: "test_openai_responses_operational_reentry_matched_cohort.v0.1",
      };
    },
    async prepare(purpose) {
      if (purpose !== OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01) return null;
      return {
        ...this.describe(purpose),
        purpose,
        provider_ref: providerRefV01(),
        model_ref: modelRefV01(),
        async invoke(input, lifecycle) {
          assert.equal(input.input_kind, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01);
          assert.match(
            lifecycle.provider_request_trace_id ?? "",
            /^acgc_trace_[0-9a-f]{40}$/u,
          );
          lifecycle.report_input_bytes(1_024);
          lifecycle.mark_egress_attempted();
          const current = invocation++;
          if (current === failInvocation) {
            throw new ModelGatewayAdapterFailureV01("adapter_provider_rejected");
          }
          return {
            purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
            output: outputFactory(input),
            usage: {
              basis: "provider_report",
              quality: "reported",
              source: "provider_response",
              input_tokens: 120,
              cached_input_tokens: 0,
              output_tokens: 40,
              total_tokens: 160,
            },
          };
        },
      };
    },
  };
}

function outputForV01(
  input: OperationalReentryMatchedCohortModelInputV01,
): OperationalReentryMatchedCohortModelOutputV01 {
  const isStale = input.stale_relation !== null;
  const targetAvailable = input.target_context_token !== null;
  const isA = targetAvailable && !isStale;
  const isB = !targetAvailable && input.context_material.length > 0;
  if (isB) {
    return {
      result_token: "result_review_blocked",
      referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
      required_check_dispositions: ["verify_portable_output:blocked"],
      operation_action_class_tokens: ["no_external_action"],
      blocker_warning_gap_tokens: ["gap_support_unknown"],
      result_limitation_tokens: ["limitation_non_authoritative", "limitation_target_not_available"],
      target_disposition: "not_available",
      abstention: true,
    };
  }
  if (isStale) {
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
    operation_action_class_tokens: isA
      ? ["bounded_result_review", "target_linked_verification_preparation"]
      : ["bounded_result_review"],
    blocker_warning_gap_tokens: targetAvailable
      ? ["gap_decision_pending", "gap_support_unknown"]
      : [],
    result_limitation_tokens: targetAvailable
      ? ["limitation_non_authoritative"]
      : ["limitation_non_authoritative", "limitation_target_not_available"],
    target_disposition: targetAvailable ? "applied_to_structure" : "not_available",
    abstention: false,
  };
}

function gatewayDependenciesV01(adapter: ModelAdapterV01) {
  return {
    adapter,
    open_database: () => new Database(databasePath),
    read_root_availability: async () => "available" as const,
    now: () => new Date("2026-08-17T12:00:00.000Z"),
  };
}

function envelopeV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  built: ReturnType<typeof buildOperationalReentryMatchedCohortV01>,
  input: OperationalReentryMatchedCohortModelInputV01,
  invocationId: string,
) {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: invocationId,
    provider_request_trace_id:
      createDeterministicModelProviderRequestTraceV01({
        request_family_kind: "cohort_attempt",
        request_family_fingerprint: built.manifest.integrity.fingerprint,
      }),
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [built.case.integrity.fingerprint],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
    budget: {
      max_input_bytes: 12_288,
      max_output_tokens: 256,
      max_provider_calls: 1 as const,
      cost_budget: built.pricing.gateway_cost_budget,
    },
    timeout_ms: 30_000,
    cancellation: { signal: new AbortController().signal },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision: admission.expected_active_selection_revision,
    },
    project_root: admission.project_root,
    input,
  };
}

function initializeDatabaseV01(): void {
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf8"));
  database.close();
}

function registerProjectV01(): ModelGatewayInteractiveAdmissionV01 {
  const db = new Database(databasePath);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => "11111111-1111-4111-8111-111111111111",
    now: () => "2026-08-17T11:59:00.000Z",
  });
  const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
    base_path: path.parse(projectRoot).root,
  });
  const project = getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspace.workspace_id,
    local_root: localRoot,
    display_name: "e2-test-project",
  }, {
    create_uuid: () => "22222222-2222-4222-8222-222222222222",
    now: () => "2026-08-17T11:59:01.000Z",
  });
  const active = selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    now: "2026-08-17T11:59:02.000Z",
    expected_project_id: null,
    expected_revision: null,
  });
  db.close();
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

function providerRefV01() {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "model_provider",
    external_id: "openai",
    provider: "openai",
    trust_class: "direct_local_observation" as const,
  };
}

function modelRefV01() {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "provider_model",
    external_id: "gpt-4.1-mini-2025-04-14",
    provider: "openai",
    trust_class: "direct_local_observation" as const,
  };
}
