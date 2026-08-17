import {
  assertModelEgressTextIsSafe,
  requireModelEgressText,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import { operationalReentryMatchedCohortCaseFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  buildModelGatewayCostBudgetV01,
  assertModelGatewayCostBudgetCurrentV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  isModelGatewayInvocationErrorV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV01,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryMatchedCohortModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  buildOperationalReentryMatchedCohortSystemPromptV01,
  operationalReentryMatchedCohortResponseSchemaV02,
  projectOperationalReentryMatchedCohortModelMaterialV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import {
  OPENAI_RESPONSES_ENDPOINT_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  buildOperationalReentryMatchedCohortCallPlanV01,
  buildOperationalReentryMatchedCohortPricingV01,
  ACGC_E2_HISTORICAL_HEAD_V02,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  type OperationalReentryMatchedCohortCaseV01,
  type OperationalReentryMatchedCohortIntegrityV01,
  type OperationalReentryMatchedCohortModelInputV01,
  type OperationalReentryMatchedCohortRouteV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import {
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01,
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PROVIDER_CONTRACT_VERSION_V01,
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01,
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
  type OperationalReentryProviderCompatibilityProbeAuthorizationV01,
  type OperationalReentryProviderCompatibilityProbeExecutionResultV01,
  type OperationalReentryProviderCompatibilityProbeManifestV01,
  type OperationalReentryProviderCompatibilityProbeOutcomeV01,
  type OperationalReentryProviderCompatibilityProbePlanArtifactEntryV01,
  type OperationalReentryProviderCompatibilityProbePlanEntryV01,
  type OperationalReentryProviderCompatibilityProbePlanV01,
  type OperationalReentryProviderCompatibilityProbePricingV01,
  type OperationalReentryProviderCompatibilityProbeProviderContractV01,
  type OperationalReentryProviderCompatibilityProbeReportV01,
  type OperationalReentryProviderCompatibilityProbeShapeTerminalV01,
  type OperationalReentryProviderCompatibilityProbeShapeV01,
  type OperationalReentryProviderCompatibilityProbeTerminalCategoryV01,
} from "@/types/vnext/operational-reentry-provider-compatibility-probe";

export const ACGC_E2P1_ISSUE_NUMBER_V01 = 191 as const;
export const ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01 = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);
export const ACGC_E2P1_MAXIMUM_PROVIDER_CALLS_V01 = 4 as const;
export const ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01 =
  250_000_000 as const;
export const ACGC_E2P1_PROBE_OUTCOMES_V01 = Object.freeze([
  "accepted_all_shapes",
  "provider_rejected",
  "provider_response_invalid",
  "transport_or_runtime_incomplete",
  "not_run",
] as const);
export const ACGC_E2P1_TERMINAL_CATEGORIES_V01 = Object.freeze([
  "accepted_and_normalized",
  "provider_rejected",
  "provider_response_invalid",
  "transport_failed",
  "timed_out",
  "cancelled",
  "blocked_before_egress",
  "internal_failure",
  "not_attempted_after_terminal_failure",
] as const);

const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;
const SAFE_AUTHORIZATION_ID_V01 = /^[A-Za-z0-9:._-]{1,200}$/u;
const SHAPE_MEANINGS_V01 = Object.freeze({
  A: "target_present_fresh",
  B: "non_target_context_present_target_absent",
  C: "target_present_exact_stale_regime_relation",
  D: "no_continuation_context_target_absent",
} as const);

export class OperationalReentryProviderCompatibilityProbeErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryProviderCompatibilityProbeErrorV01";
  }
}

export interface BuildOperationalReentryProviderCompatibilityProbeInputV01 {
  authorization: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV01;
  evaluated_at: string;
}

export interface RunOperationalReentryProviderCompatibilityProbeDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV01;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV01;
  cancellation_signal?: AbortSignal;
  assert_source_unchanged: (
    entry: OperationalReentryProviderCompatibilityProbePlanEntryV01,
  ) => void | Promise<void>;
  consume_authorization: (input: {
    authorization: OperationalReentryProviderCompatibilityProbeAuthorizationV01;
    probe_id: string;
  }) => void;
  on_shape_terminal?: (
    shape: OperationalReentryProviderCompatibilityProbeShapeTerminalV01,
  ) => void | Promise<void>;
}

export interface OperationalReentryProviderCompatibilityProbeAuthorizationExpectationsV01 {
  case_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  pricing_authority_fingerprint: string;
  pricing_fingerprint: string;
  pricing_expires_at: string;
  aggregate_worst_case_cost_nano_usd: number;
}

export function buildOperationalReentryProviderCompatibilityProbeAuthorizationExpectationsV01(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV01;
    evaluated_at: string;
  },
): OperationalReentryProviderCompatibilityProbeAuthorizationExpectationsV01 {
  const providerContract =
    buildOperationalReentryProviderCompatibilityProbeProviderContractV01(
      input.route,
    );
  const pricing = buildOperationalReentryProviderCompatibilityProbePricingV01(
    input,
  );
  return {
    case_fingerprint:
      operationalReentryMatchedCohortCaseFixtureV01.integrity.fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    provider_contract_fingerprint: providerContract.integrity.fingerprint,
    pricing_authority_fingerprint:
      pricing.gateway_cost_budget.authority.pricing_fingerprint,
    pricing_fingerprint: pricing.integrity.fingerprint,
    pricing_expires_at: pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      pricing.aggregate_worst_case_cost_nano_usd,
  };
}

export function validateOperationalReentryProviderCompatibilityProbeAuthorizationV01(
  value: unknown,
  input: {
    evaluated_at: string;
    route: OperationalReentryMatchedCohortRouteV01;
    provider_contract: OperationalReentryProviderCompatibilityProbeProviderContractV01;
    pricing: OperationalReentryProviderCompatibilityProbePricingV01;
  },
): OperationalReentryProviderCompatibilityProbeAuthorizationV01 {
  if (!isRecordV01(value)) failV01("operational_reentry_probe_authorization_missing_or_malformed");
  exactKeysV01(value, [
    "authorization_version",
    "authorization_id",
    "authorization_kind",
    "request_family_kind",
    "future_live_issue_number",
    "exact_merged_source_head",
    "planned_shapes",
    "canonical_order",
    "maximum_provider_calls",
    "maximum_parallel_calls",
    "retries",
    "replacement_calls",
    "fresh_stateless_request_per_shape",
    "conversation_reuse",
    "thread_reuse",
    "previous_response_reuse",
    "stop_after_first_non_success_terminal_result",
    "second_probe_authorized",
    "replacement_cohort_authorized",
    "stage_7_authorized",
    "maximum_total_cost_nano_usd",
    "case_fingerprint",
    "route_fingerprint",
    "provider_contract_fingerprint",
    "pricing_authority_fingerprint",
    "issued_at",
    "expires_at",
    "integrity",
  ]);
  const authorization = structuredClone(
    value,
  ) as unknown as OperationalReentryProviderCompatibilityProbeAuthorizationV01;
  assertSealedV01(authorization);
  const issuedAt = timestampV01(authorization.issued_at);
  const expiresAt = timestampV01(authorization.expires_at);
  const evaluatedAt = timestampV01(input.evaluated_at);
  const pricingExpiresAt = timestampV01(input.pricing.pricing_expires_at);
  if (
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01 ||
    !SAFE_AUTHORIZATION_ID_V01.test(authorization.authorization_id) ||
    authorization.authorization_id.toLowerCase().includes("cohort") ||
    authorization.authorization_id.toLowerCase().includes("replacement") ||
    authorization.authorization_kind !==
      "one_bounded_provider_compatibility_probe" ||
    authorization.request_family_kind !== "compatibility_probe" ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= ACGC_E2P1_ISSUE_NUMBER_V01 ||
    !GIT_SHA_V01.test(authorization.exact_merged_source_head) ||
    authorization.exact_merged_source_head === ACGC_E2_HISTORICAL_HEAD_V02 ||
    authorization.planned_shapes !== 4 ||
    canonicalizeProtocolValueV01(authorization.canonical_order) !==
      canonicalizeProtocolValueV01(ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01) ||
    authorization.maximum_provider_calls !== 4 ||
    authorization.maximum_parallel_calls !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacement_calls !== 0 ||
    authorization.fresh_stateless_request_per_shape !== true ||
    authorization.conversation_reuse !== false ||
    authorization.thread_reuse !== false ||
    authorization.previous_response_reuse !== false ||
    authorization.stop_after_first_non_success_terminal_result !== true ||
    authorization.second_probe_authorized !== false ||
    authorization.replacement_cohort_authorized !== false ||
    authorization.stage_7_authorized !== false ||
    authorization.maximum_total_cost_nano_usd !==
      ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01 ||
    authorization.case_fingerprint !==
      operationalReentryMatchedCohortCaseFixtureV01.integrity.fingerprint ||
    authorization.route_fingerprint !== input.route.integrity_fingerprint ||
    authorization.provider_contract_fingerprint !==
      input.provider_contract.integrity.fingerprint ||
    authorization.pricing_authority_fingerprint !==
      input.pricing.gateway_cost_budget.authority.pricing_fingerprint ||
    issuedAt >= expiresAt ||
    evaluatedAt < issuedAt ||
    evaluatedAt >= expiresAt ||
    expiresAt > pricingExpiresAt
  ) {
    failV01("operational_reentry_probe_authorization_mismatched");
  }
  return authorization;
}

export function buildOperationalReentryProviderCompatibilityProbeProviderContractV01(
  route: OperationalReentryMatchedCohortRouteV01,
): OperationalReentryProviderCompatibilityProbeProviderContractV01 {
  assertExactProbeRouteV01(route);
  return sealV01("provider_contract_without_integrity_fingerprint", {
    provider_contract_identity_version:
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PROVIDER_CONTRACT_VERSION_V01,
    reused_provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    reused_codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02,
    strict_schema_supported_subset_version:
      "openai_strict_schema_supported_subset.v0.1" as const,
    response_schema_version:
      "operational_reentry_matched_cohort_response_schema.v0.2" as const,
    parser_version: "operational_reentry_matched_cohort_parser.v0.1" as const,
    endpoint: OPENAI_RESPONSES_ENDPOINT_V01,
    provider_ref: structuredClone(route.provider_ref),
    model_ref: structuredClone(route.model_ref),
    adapter_implementation_id:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
    deterministic_fallback_counts_as_success: false as const,
    target_and_stale_consistency_rules_preserved: true as const,
  });
}

export function buildOperationalReentryProviderCompatibilityProbePricingV01(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV01;
    evaluated_at: string;
  },
): OperationalReentryProviderCompatibilityProbePricingV01 {
  assertExactProbeRouteV01(input.route);
  const reusedPricing = buildOperationalReentryMatchedCohortPricingV01(input);
  const budget = buildModelGatewayCostBudgetV01({
    authority: reusedPricing.gateway_cost_budget.authority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.timeoutMs,
    maximum_permitted_cost:
      ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
    evaluated_at: input.evaluated_at,
  });
  assertModelGatewayCostBudgetCurrentV01(budget, input.evaluated_at);
  const aggregateWorstCase =
    budget.calculated_worst_case_cost * ACGC_E2P1_MAXIMUM_PROVIDER_CALLS_V01;
  if (
    !Number.isSafeInteger(aggregateWorstCase) ||
    aggregateWorstCase > ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01
  ) {
    failV01("operational_reentry_probe_aggregate_cost_ceiling_exceeded");
  }
  return sealV01("pricing_without_integrity_fingerprint", {
    pricing_version:
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01,
    provider_ref: structuredClone(input.route.provider_ref),
    model_ref: structuredClone(input.route.model_ref),
    route_fingerprint: input.route.integrity_fingerprint,
    pricing_source: reusedPricing.pricing_source,
    pricing_source_url: reusedPricing.pricing_source_url,
    pricing_source_version:
      reusedPricing.gateway_cost_budget.authority.pricing_source_version,
    pricing_effective_at: reusedPricing.pricing_effective_at,
    pricing_expires_at: reusedPricing.pricing_expires_at,
    evaluated_at: input.evaluated_at,
    gateway_cost_budget: budget,
    per_shape_worst_case_cost_nano_usd: budget.calculated_worst_case_cost,
    aggregate_worst_case_cost_nano_usd: aggregateWorstCase,
    aggregate_ceiling_nano_usd:
      ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
    missing_usage_or_exact_cost: "unknown_never_zero" as const,
  });
}

export function buildOperationalReentryProviderCompatibilityProbeProviderVisibleRequestV01(
  modelInput: OperationalReentryMatchedCohortModelInputV01,
): {
  request_body: string;
  request_fingerprint: string;
  schema_fingerprint: string;
  adapter_request_route_fingerprint: string;
} {
  const schema = operationalReentryMatchedCohortResponseSchemaV02(modelInput);
  validateOpenAIStrictSchemaSupportedSubsetV01(schema);
  const dynamicMaterial =
    projectOperationalReentryMatchedCohortModelMaterialV01({
      canonical_project_id:
        "project:00000000-0000-4000-8000-000000000000",
      ...modelInput,
    });
  const dynamicText = serializeModelEgressJson(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    dynamicMaterial,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.dynamicBytes,
  );
  assertModelEgressTextIsSafe(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    dynamicText,
  );
  const requestBody = serializeModelEgressJson(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    {
      model: requireModelEgressText(
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
        128,
      ),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildOperationalReentryMatchedCohortSystemPromptV01(),
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: dynamicText }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "operational_reentry_matched_cohort",
          strict: true,
          schema,
        },
      },
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
      store: false,
    },
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
  );
  return {
    request_body: requestBody,
    request_fingerprint: createProtocolSha256V01(requestBody),
    schema_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(schema),
    ),
    adapter_request_route_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
        provider: "openai",
        model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
        adapter_implementation_id:
          OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
        adapter_implementation_version:
          OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
      }),
    ),
  };
}

export function buildOperationalReentryProviderCompatibilityProbeV01(
  input: BuildOperationalReentryProviderCompatibilityProbeInputV01,
): {
  authorization: OperationalReentryProviderCompatibilityProbeAuthorizationV01;
  manifest: OperationalReentryProviderCompatibilityProbeManifestV01;
  case: OperationalReentryMatchedCohortCaseV01;
  provider_contract: OperationalReentryProviderCompatibilityProbeProviderContractV01;
  plan: OperationalReentryProviderCompatibilityProbePlanV01;
  pricing: OperationalReentryProviderCompatibilityProbePricingV01;
} {
  const providerContract =
    buildOperationalReentryProviderCompatibilityProbeProviderContractV01(
      input.route,
    );
  const pricing = buildOperationalReentryProviderCompatibilityProbePricingV01({
    admission: input.admission,
    route: input.route,
    evaluated_at: input.evaluated_at,
  });
  const authorization =
    validateOperationalReentryProviderCompatibilityProbeAuthorizationV01(
      input.authorization,
      {
        evaluated_at: input.evaluated_at,
        route: input.route,
        provider_contract: providerContract,
        pricing,
      },
    );
  const caseValue = structuredClone(
    operationalReentryMatchedCohortCaseFixtureV01,
  );
  const cohortPlan = buildOperationalReentryMatchedCohortCallPlanV01(caseValue);
  const entriesWithoutTrace = ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01.map(
    (shape, index) => {
      const sourceEntry = cohortPlan.entries.find(
        (entry) => entry.arm === shape,
      );
      if (!sourceEntry) failV01("operational_reentry_probe_shape_missing");
      const callSlotId = `e2p-call-${String(index).padStart(2, "0")}-${createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          case_fingerprint: caseValue.integrity.fingerprint,
          canonical_order: index,
          source_input_fingerprint: sourceEntry.model_input_fingerprint,
        }),
      ).slice("sha256:".length, "sha256:".length + 12)}`;
      const modelInput = structuredClone(sourceEntry.model_input);
      modelInput.invocation_context = {
        cohort_ref: "operational-reentry-compatibility-probe",
        call_slot_id: callSlotId,
        repeat_block: 0,
      };
      const request =
        buildOperationalReentryProviderCompatibilityProbeProviderVisibleRequestV01(
          modelInput,
        );
      return {
        canonical_order: index as 0 | 1 | 2 | 3,
        shape,
        representative_shape_meaning: SHAPE_MEANINGS_V01[shape],
        call_slot_id: callSlotId,
        model_input: modelInput,
        representative_input_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(modelInput),
        ),
        schema_fingerprint: request.schema_fingerprint,
        provider_visible_request_fingerprint: request.request_fingerprint,
        adapter_request_route_fingerprint:
          request.adapter_request_route_fingerprint,
        strict_schema_preflight: "passed" as const,
      };
    },
  );
  const requestFamilyBasisFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      authorization_fingerprint: authorization.integrity.fingerprint,
      source_repository_head_sha: authorization.exact_merged_source_head,
      future_live_issue_number: authorization.future_live_issue_number,
      case_fingerprint: caseValue.integrity.fingerprint,
      route_fingerprint: input.route.integrity_fingerprint,
      provider_contract_fingerprint: providerContract.integrity.fingerprint,
      pricing_fingerprint: pricing.integrity.fingerprint,
      entries: entriesWithoutTrace.map(({ model_input: _input, ...entry }) =>
        entry,
      ),
      policy: {
        request_family_kind: "compatibility_probe",
        canonical_order: ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01,
        maximum_provider_calls: 4,
        maximum_parallel_calls: 1,
        retries: 0,
        replacement_calls: 0,
        stop_after_first_non_success_terminal_result: true,
      },
    }),
  );
  const requestFamilyTraceId =
    createDeterministicModelProviderRequestTraceV01({
      request_family_kind: "compatibility_probe",
      request_family_fingerprint: requestFamilyBasisFingerprint,
    });
  const entries: OperationalReentryProviderCompatibilityProbePlanEntryV01[] =
    entriesWithoutTrace.map((entry) => ({
      ...entry,
      request_family_trace_id: requestFamilyTraceId,
      client_request_id: createDeterministicModelClientRequestIdV01({
        purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
        provider_request_trace_id: requestFamilyTraceId,
        call_slot_id: entry.call_slot_id,
        model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
      }),
    }));
  const plan = sealV01("plan_without_integrity_fingerprint", {
    plan_version:
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01,
    authorization_fingerprint: authorization.integrity.fingerprint,
    source_repository_head_sha: authorization.exact_merged_source_head,
    future_live_issue_number: authorization.future_live_issue_number,
    request_family_kind: "compatibility_probe" as const,
    request_family_basis_fingerprint: requestFamilyBasisFingerprint,
    request_family_trace_id: requestFamilyTraceId,
    canonical_order: ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01,
    planned_shapes: 4 as const,
    maximum_provider_calls: 4 as const,
    maximum_parallel_calls: 1 as const,
    retries: 0 as const,
    replacement_calls: 0 as const,
    fresh_stateless_request_per_shape: true as const,
    conversation_reuse: false as const,
    thread_reuse: false as const,
    previous_response_reuse: false as const,
    adaptive_prompt_schema_or_input_changes: false as const,
    stop_after_first_non_success_terminal_result: true as const,
    remaining_shapes_after_terminal_failure:
      "not_attempted_after_terminal_failure" as const,
    entries,
  });
  const probeId = `operational-reentry-provider-probe:${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      authorization_fingerprint: authorization.integrity.fingerprint,
      plan_fingerprint: plan.integrity.fingerprint,
    }),
  ).slice("sha256:".length, "sha256:".length + 32)}`;
  const manifest = sealV01("manifest_without_integrity_fingerprint", {
    probe_version:
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
    probe_id: probeId,
    future_live_issue_number: authorization.future_live_issue_number,
    source_repository_head_sha: authorization.exact_merged_source_head,
    authorization_fingerprint: authorization.integrity.fingerprint,
    source_ref: structuredClone(caseValue.source_ref),
    case_fingerprint: caseValue.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
    route: structuredClone(input.route),
    provider_contract_fingerprint: providerContract.integrity.fingerprint,
    pricing_fingerprint: pricing.integrity.fingerprint,
    pricing_authority_fingerprint:
      pricing.gateway_cost_budget.authority.pricing_fingerprint,
    request_family_kind: "compatibility_probe" as const,
    request_family_trace_id: requestFamilyTraceId,
    provider_egress:
      "allow_only_with_supplied_future_authorization" as const,
    execution_mode: "live" as const,
    data_classification: "public_safe" as const,
    retention_class: "none" as const,
    raw_prompt_persisted: false as const,
    raw_request_body_persisted: false as const,
    raw_provider_response_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    credentials_or_full_headers_persisted: false as const,
    manual_retries: 0 as const,
    replacement_calls: 0 as const,
  });
  const prepared = {
    authorization,
    manifest,
    case: caseValue,
    provider_contract: providerContract,
    plan,
    pricing,
  };
  validatePreparedProbeV01(prepared);
  return structuredClone(prepared);
}

export async function runOperationalReentryProviderCompatibilityProbeV01(
  input: BuildOperationalReentryProviderCompatibilityProbeInputV01,
  dependencies: RunOperationalReentryProviderCompatibilityProbeDependenciesV01,
): Promise<OperationalReentryProviderCompatibilityProbeExecutionResultV01> {
  if (
    !dependencies ||
    typeof dependencies.assert_source_unchanged !== "function" ||
    typeof dependencies.consume_authorization !== "function"
  ) {
    failV01("operational_reentry_probe_runtime_dependencies_missing");
  }
  const prepared =
    buildOperationalReentryProviderCompatibilityProbeV01(input);
  const invokeGateway =
    dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV01;
  const cancellation =
    dependencies.cancellation_signal ?? new AbortController().signal;
  const shapes: OperationalReentryProviderCompatibilityProbeShapeTerminalV01[] =
    [];
  let authorizationConsumed = false;
  let terminalFailureObserved = false;

  for (const entry of prepared.plan.entries) {
    if (terminalFailureObserved) {
      const unattempted = terminalV01({
        entry,
        prepared,
        category: "not_attempted_after_terminal_failure",
        receipt: null,
        output: null,
        failure_code: "not_attempted_after_terminal_failure",
      });
      shapes.push(unattempted);
      await dependencies.on_shape_terminal?.(unattempted);
      continue;
    }
    try {
      await dependencies.assert_source_unchanged(entry);
    } catch {
      const blocked = terminalV01({
        entry,
        prepared,
        category: "blocked_before_egress",
        receipt: null,
        output: null,
        failure_code: "source_head_or_worktree_drift",
      });
      shapes.push(blocked);
      await dependencies.on_shape_terminal?.(blocked);
      terminalFailureObserved = true;
      continue;
    }

    let terminal: OperationalReentryProviderCompatibilityProbeShapeTerminalV01;
    try {
      const result = await invokeGateway(
        buildEnvelopeV01(entry, prepared, input.admission, cancellation),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_route:
            prepared.manifest.route,
          on_provider_egress_attempt() {
            if (!authorizationConsumed) {
              dependencies.consume_authorization({
                authorization: prepared.authorization,
                probe_id: prepared.manifest.probe_id,
              });
              authorizationConsumed = true;
            }
          },
        },
      );
      if (
        result.generator !== "openai" ||
        result.model_invocation_receipt.execution_mode !== "live" ||
        result.model_invocation_receipt.selection_reason !== "requested_live" ||
        result.model_invocation_receipt.egress_attempted !== true ||
        result.model_invocation_receipt.status !== "completed" ||
        result.model_invocation_receipt.outcome !== "live_success"
      ) {
        failV01("operational_reentry_probe_deterministic_or_unobserved_success_refused");
      }
      terminal = terminalV01({
        entry,
        prepared,
        category: "accepted_and_normalized",
        receipt: result.model_invocation_receipt,
        output: result.output,
        failure_code: null,
      });
    } catch (error) {
      terminal = terminalFromErrorV01(entry, prepared, error);
    }
    shapes.push(terminal);
    await dependencies.on_shape_terminal?.(terminal);
    if (terminal.terminal_category !== "accepted_and_normalized") {
      terminalFailureObserved = true;
    }
  }

  let sourceUnchangedAtTerminal = true;
  try {
    await dependencies.assert_source_unchanged(
      prepared.plan.entries[prepared.plan.entries.length - 1]!,
    );
  } catch {
    sourceUnchangedAtTerminal = false;
  }
  const report = buildReportV01(
    prepared.manifest.probe_id,
    shapes,
    prepared.pricing,
    sourceUnchangedAtTerminal,
    authorizationConsumed,
  );
  const result: OperationalReentryProviderCompatibilityProbeExecutionResultV01 =
    {
      result_kind:
        report.outcome === "transport_or_runtime_incomplete" ||
        report.outcome === "not_run"
          ? "incomplete"
          : "complete",
      ...prepared,
      shapes,
      report,
    };
  return validateOperationalReentryProviderCompatibilityProbeExecutionResultV01(
    result,
  );
}

export function deriveOperationalReentryProviderCompatibilityProbeOutcomeV01(
  categories: OperationalReentryProviderCompatibilityProbeTerminalCategoryV01[],
  sourceUnchangedAtTerminal = true,
): OperationalReentryProviderCompatibilityProbeOutcomeV01 {
  if (categories.length === 0) return "not_run";
  if (!sourceUnchangedAtTerminal) return "transport_or_runtime_incomplete";
  if (
    categories.length === 4 &&
    categories.every((category) => category === "accepted_and_normalized")
  ) {
    return "accepted_all_shapes";
  }
  const failure = categories.find(
    (category) =>
      category !== "accepted_and_normalized" &&
      category !== "not_attempted_after_terminal_failure",
  );
  if (failure === "provider_rejected") return "provider_rejected";
  if (failure === "provider_response_invalid") {
    return "provider_response_invalid";
  }
  return "transport_or_runtime_incomplete";
}

export function projectOperationalReentryProviderCompatibilityProbePlanForArtifactV01(
  plan: OperationalReentryProviderCompatibilityProbePlanV01,
): Omit<OperationalReentryProviderCompatibilityProbePlanV01, "entries"> & {
  entries: OperationalReentryProviderCompatibilityProbePlanArtifactEntryV01[];
} {
  assertSealedV01(plan);
  return {
    ...structuredClone(plan),
    entries: plan.entries.map(({ model_input: _input, ...entry }) => ({
      ...structuredClone(entry),
      provider_visible_input_persisted: false as const,
      raw_request_body_persisted: false as const,
    })),
  };
}

export function validateOperationalReentryProviderCompatibilityProbeExecutionResultV01(
  result: OperationalReentryProviderCompatibilityProbeExecutionResultV01,
): OperationalReentryProviderCompatibilityProbeExecutionResultV01 {
  assertSealedV01(result.authorization);
  assertSealedV01(result.manifest);
  assertSealedV01(result.case);
  assertSealedV01(result.provider_contract);
  assertSealedV01(result.plan);
  assertSealedV01(result.pricing);
  assertSealedV01(result.report);
  result.shapes.forEach(assertSealedV01);
  validatePreparedProbeV01(result);
  if (
    result.shapes.length !== 4 ||
    result.shapes.some(
      (shape, index) =>
        shape.canonical_order !== index ||
        shape.shape !== ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01[index] ||
        shape.call_slot_id !== result.plan.entries[index]?.call_slot_id,
    ) ||
    canonicalizeProtocolValueV01(
      buildReportV01(
        result.manifest.probe_id,
        result.shapes,
        result.pricing,
        result.report.source_head_and_tracked_worktree_unchanged_at_terminal,
        result.report.authorization_consumed,
      ),
    ) !== canonicalizeProtocolValueV01(result.report)
  ) {
    failV01("operational_reentry_probe_result_invalid");
  }
  let failureSeen = false;
  for (const shape of result.shapes) {
    if (failureSeen && shape.terminal_category !== "not_attempted_after_terminal_failure") {
      failV01("operational_reentry_probe_stop_policy_invalid");
    }
    if (
      shape.terminal_category !== "accepted_and_normalized" &&
      shape.terminal_category !== "not_attempted_after_terminal_failure"
    ) {
      failureSeen = true;
    }
  }
  scanForbiddenMaterialV01({
    authorization: result.authorization,
    manifest: result.manifest,
    plan: projectOperationalReentryProviderCompatibilityProbePlanForArtifactV01(
      result.plan,
    ),
    shapes: result.shapes,
    report: result.report,
  });
  return structuredClone(result);
}

function validatePreparedProbeV01(value: {
  authorization: OperationalReentryProviderCompatibilityProbeAuthorizationV01;
  manifest: OperationalReentryProviderCompatibilityProbeManifestV01;
  case: OperationalReentryMatchedCohortCaseV01;
  provider_contract: OperationalReentryProviderCompatibilityProbeProviderContractV01;
  plan: OperationalReentryProviderCompatibilityProbePlanV01;
  pricing: OperationalReentryProviderCompatibilityProbePricingV01;
}): void {
  assertSealedV01(value.authorization);
  assertSealedV01(value.manifest);
  assertSealedV01(value.case);
  assertSealedV01(value.provider_contract);
  assertSealedV01(value.plan);
  assertSealedV01(value.pricing);
  assertExactProbeRouteV01(value.manifest.route);
  if (
    value.manifest.authorization_fingerprint !==
      value.authorization.integrity.fingerprint ||
    value.manifest.source_repository_head_sha !==
      value.authorization.exact_merged_source_head ||
    value.manifest.future_live_issue_number !==
      value.authorization.future_live_issue_number ||
    value.manifest.case_fingerprint !== value.case.integrity.fingerprint ||
    value.manifest.plan_fingerprint !== value.plan.integrity.fingerprint ||
    value.manifest.provider_contract_fingerprint !==
      value.provider_contract.integrity.fingerprint ||
    value.manifest.pricing_fingerprint !== value.pricing.integrity.fingerprint ||
    value.manifest.pricing_authority_fingerprint !==
      value.pricing.gateway_cost_budget.authority.pricing_fingerprint ||
    value.manifest.request_family_kind !== "compatibility_probe" ||
    value.plan.request_family_kind !== "compatibility_probe" ||
    value.plan.request_family_trace_id !==
      value.manifest.request_family_trace_id ||
    value.plan.entries.length !== 4 ||
    new Set(value.plan.entries.map((entry) => entry.client_request_id)).size !==
      4 ||
    value.plan.entries.some(
      (entry, index) =>
        entry.shape !== ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01[index] ||
        entry.canonical_order !== index ||
        entry.strict_schema_preflight !== "passed" ||
        entry.request_family_trace_id !== value.plan.request_family_trace_id,
    )
  ) {
    failV01("operational_reentry_probe_prepared_identity_invalid");
  }
}

function buildEnvelopeV01(
  entry: OperationalReentryProviderCompatibilityProbePlanEntryV01,
  prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id: prepared.plan.request_family_trace_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      prepared.case.source_ref.source_fingerprint,
      prepared.case.integrity.fingerprint,
      entry.representative_input_fingerprint,
      entry.schema_fingerprint,
      prepared.plan.integrity.fingerprint,
    ],
    privacy: {
      provider_egress: "allow" as const,
      retention_class: "none" as const,
    },
    budget: {
      max_input_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: prepared.pricing.gateway_cost_budget,
    },
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.timeoutMs,
    cancellation: { signal: cancellation },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision:
        admission.expected_active_selection_revision,
    },
    project_root: structuredClone(admission.project_root),
    input: structuredClone(entry.model_input),
  };
}

function terminalFromErrorV01(
  entry: OperationalReentryProviderCompatibilityProbePlanEntryV01,
  prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >,
  error: unknown,
): OperationalReentryProviderCompatibilityProbeShapeTerminalV01 {
  try {
    const invocationError = isModelGatewayInvocationErrorV01(error)
      ? error
      : null;
    const category = terminalCategoryV01(error);
    if (
      invocationError?.provider_rejection_observation &&
      invocationError.provider_rejection_observation.client_request_id !==
        entry.client_request_id
    ) {
      failV01("operational_reentry_probe_rejection_identity_mismatch");
    }
    return terminalV01({
      entry,
      prepared,
      category,
      receipt: invocationError?.receipt ?? null,
      output: null,
      failure_code:
        invocationError?.code ??
        (error instanceof OperationalReentryProviderCompatibilityProbeErrorV01
          ? error.code
          : "operational_reentry_probe_internal_failure"),
      provider_rejection_observation:
        invocationError?.provider_rejection_observation ?? undefined,
    });
  } catch {
    return terminalV01({
      entry,
      prepared,
      category: "internal_failure",
      receipt: null,
      output: null,
      failure_code: "operational_reentry_probe_internal_failure",
    });
  }
}

function terminalCategoryV01(
  error: unknown,
): OperationalReentryProviderCompatibilityProbeTerminalCategoryV01 {
  if (!isModelGatewayInvocationErrorV01(error)) return "internal_failure";
  if (error.code === "model_gateway_provider_rejected") {
    return "provider_rejected";
  }
  if (error.code === "model_gateway_provider_response_invalid") {
    return "provider_response_invalid";
  }
  if (error.code === "model_gateway_transport_failed") {
    return "transport_failed";
  }
  if (error.code === "model_gateway_timeout") return "timed_out";
  if (error.code === "model_gateway_cancelled") return "cancelled";
  return "blocked_before_egress";
}

function terminalV01(input: {
  entry: OperationalReentryProviderCompatibilityProbePlanEntryV01;
  prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >;
  category: OperationalReentryProviderCompatibilityProbeTerminalCategoryV01;
  receipt: OperationalReentryProviderCompatibilityProbeShapeTerminalV01["receipt"];
  output: OperationalReentryProviderCompatibilityProbeShapeTerminalV01["normalized_output"];
  failure_code: string | null;
  provider_rejection_observation?: OperationalReentryProviderCompatibilityProbeShapeTerminalV01["provider_rejection_observation"];
}): OperationalReentryProviderCompatibilityProbeShapeTerminalV01 {
  const receipt = input.receipt
    ? validateModelInvocationReceiptV02(input.receipt)
    : null;
  const usage = receipt?.usage ?? null;
  const outputFingerprint = input.output
    ? createProtocolSha256V01(canonicalizeProtocolValueV01(input.output))
    : null;
  if (
    receipt &&
    (receipt.purpose !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 ||
      receipt.invocation_id !== input.entry.call_slot_id ||
      (input.output !== null &&
        receipt.normalized_output_fingerprint !== outputFingerprint))
  ) {
    failV01("operational_reentry_probe_receipt_binding_invalid");
  }
  const exactCost =
    usage && usage.cached_input_tokens !== undefined
      ? {
          status: "calculated" as const,
          input_nano_usd:
            (usage.input_tokens - usage.cached_input_tokens) * 400 +
            usage.cached_input_tokens * 100,
          output_nano_usd: usage.output_tokens * 1600,
          total_nano_usd:
            (usage.input_tokens - usage.cached_input_tokens) * 400 +
            usage.cached_input_tokens * 100 +
            usage.output_tokens * 1600,
        }
      : {
          status: "unknown" as const,
          input_nano_usd: null,
          output_nano_usd: null,
          total_nano_usd: null,
        };
  return sealV01("shape_terminal_without_integrity_fingerprint", {
    canonical_order: input.entry.canonical_order,
    shape: input.entry.shape,
    call_slot_id: input.entry.call_slot_id,
    terminal_category: input.category,
    egress_attempted: receipt?.egress_attempted ?? false,
    request_family_kind: "compatibility_probe" as const,
    request_family_trace_id: input.entry.request_family_trace_id,
    client_request_id: input.entry.client_request_id,
    representative_input_fingerprint:
      input.entry.representative_input_fingerprint,
    schema_fingerprint: input.entry.schema_fingerprint,
    provider_visible_request_fingerprint:
      input.entry.provider_visible_request_fingerprint,
    route_fingerprint: input.prepared.manifest.route.integrity_fingerprint,
    adapter_request_route_fingerprint:
      input.entry.adapter_request_route_fingerprint,
    provider_contract_fingerprint:
      input.prepared.provider_contract.integrity.fingerprint,
    pricing_fingerprint: input.prepared.pricing.integrity.fingerprint,
    input_bytes: receipt?.budget.input_bytes_used ?? null,
    usage,
    latency_ms: receipt?.latency_ms ?? null,
    normalized_output: input.output ? structuredClone(input.output) : null,
    normalized_output_fingerprint: outputFingerprint,
    receipt,
    ...(input.provider_rejection_observation
      ? {
          provider_rejection_observation: structuredClone(
            input.provider_rejection_observation,
          ),
        }
      : {}),
    terminal_failure_code: input.failure_code,
    exact_cost: exactCost,
    worst_case_cost_nano_usd:
      input.prepared.pricing.per_shape_worst_case_cost_nano_usd,
    operator_intervention: {
      retries: 0 as const,
      replacement_calls: 0 as const,
      manual_normalized_output_edits: 0 as const,
    },
  });
}

function buildReportV01(
  probeId: string,
  shapes: OperationalReentryProviderCompatibilityProbeShapeTerminalV01[],
  pricing: OperationalReentryProviderCompatibilityProbePricingV01,
  sourceUnchangedAtTerminal: boolean,
  authorizationConsumed: boolean,
): OperationalReentryProviderCompatibilityProbeReportV01 {
  const categories = shapes.map((shape) => shape.terminal_category);
  const outcome =
    deriveOperationalReentryProviderCompatibilityProbeOutcomeV01(
      categories,
      sourceUnchangedAtTerminal,
    );
  const counts = Object.fromEntries(
    ACGC_E2P1_TERMINAL_CATEGORIES_V01.map((category) => [
      category,
      categories.filter((value) => value === category).length,
    ]),
  ) as Record<
    OperationalReentryProviderCompatibilityProbeTerminalCategoryV01,
    number
  >;
  const exactCosts = shapes
    .filter((shape) => shape.egress_attempted)
    .map((shape) => shape.exact_cost.total_nano_usd);
  const allExactCostsKnown =
    exactCosts.length > 0 && exactCosts.every((cost) => cost !== null);
  const firstFailure = shapes.find(
    (shape) =>
      shape.terminal_category !== "accepted_and_normalized" &&
      shape.terminal_category !== "not_attempted_after_terminal_failure",
  )?.terminal_category ?? null;
  return sealV01("report_without_integrity_fingerprint", {
    report_version:
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01,
    probe_id: probeId,
    outcome,
    planned_shapes: 4 as const,
    shape_records: shapes.length,
    terminal_shape_count: shapes.filter(
      (shape) =>
        shape.terminal_category !== "not_attempted_after_terminal_failure",
    ).length,
    attempted_provider_calls: shapes.filter((shape) => shape.egress_attempted)
      .length,
    accepted_and_normalized_shapes:
      counts.accepted_and_normalized,
    not_attempted_after_terminal_failure:
      counts.not_attempted_after_terminal_failure,
    source_head_and_tracked_worktree_unchanged_at_terminal:
      sourceUnchangedAtTerminal,
    authorization_consumed: authorizationConsumed,
    first_terminal_failure: firstFailure,
    terminal_category_counts: counts,
    exact_cost: {
      status: allExactCostsKnown ? ("calculated" as const) : ("unknown" as const),
      calculated_total_nano_usd: allExactCostsKnown
        ? (exactCosts as number[]).reduce((sum, value) => sum + value, 0)
        : null,
      aggregate_worst_case_cost_nano_usd:
        pricing.aggregate_worst_case_cost_nano_usd,
      aggregate_ceiling_nano_usd:
        ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
      missing_usage_or_exact_cost: "unknown_never_zero" as const,
    },
    real_provider_calls_observed_by_harness: null,
    probe_scope_boundary: {
      operational_reentry_evaluation_built: false as const,
      behavioral_analysis_generated: false as const,
      model_or_provider_quality_judgment_generated: false as const,
      continuation_benefit_or_harm_claim_generated: false as const,
    },
    authority_ledger: {
      is_core_record: false as const,
      is_evidence: false as const,
      is_proposal: false as const,
      is_review_decision: false as const,
      is_transition: false as const,
      is_policy: false as const,
      writes_product_database: 0 as const,
      writes_core: 0 as const,
      mutates_task_context_packet: false as const,
      mutates_current_work: false as const,
      mutates_semantic_state: false as const,
      authorizes_execution_beyond_probe: false as const,
      authorizes_second_probe: false as const,
      authorizes_replacement_cohort: false as const,
      authorizes_stage_7: false as const,
      authorizes_retry_or_scheduling: false as const,
      authorizes_automatic_context_injection: false as const,
      authorizes_fallback_or_rollback: false as const,
      authorizes_start_or_resume: false as const,
      authorizes_publication: false as const,
      authorizes_ready_merge_or_auto_merge: false as const,
      product_api_or_ui_changes: false as const,
    },
    limitations: [
      "This compatibility probe reports provider acceptance and local parse validity only.",
      "It creates no E1 evaluation, behavioral comparison, conditioning, support, outcome, causal, quality, benefit, harm, scalar, rank, or winner claim.",
      "A successful compatibility probe is not replacement-cohort, policy, Stage 7, publication, Ready, or merge authority.",
      "Missing provider usage or exact cost remains unknown and is never interpreted as zero.",
    ],
  });
}

function assertExactProbeRouteV01(
  route: OperationalReentryMatchedCohortRouteV01,
): void {
  const { integrity_fingerprint: fingerprint, ...withoutFingerprint } = route;
  if (
    route.gateway_version !== MODEL_GATEWAY_VERSION_V01 ||
    route.purpose !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 ||
    route.provider_ref.external_id !== "openai" ||
    route.model_ref.external_id !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02 ||
    route.adapter_implementation_id !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01 ||
    route.adapter_implementation_version !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03 ||
    route.prepared_without_provider_egress !== true ||
    fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutFingerprint),
      )
  ) {
    failV01("operational_reentry_probe_route_mismatch");
  }
}

function scanForbiddenMaterialV01(value: unknown): void {
  const text = canonicalizeProtocolValueV01(value).toLowerCase();
  for (const forbidden of [
    "chain_of_thought",
    "authorization: bearer",
    "openai_api_key",
    "\"request_body\":",
    "raw_provider_message",
    "\"headers\":",
    "cookie:",
    "/users/",
    "/home/",
  ]) {
    if (text.includes(forbidden)) {
      failV01("operational_reentry_probe_forbidden_material");
    }
  }
}

function assertSealedV01(value: {
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}): void {
  const { integrity, ...withoutIntegrity } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    !SHA256_V01.test(integrity.fingerprint) ||
    integrity.fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrity),
      )
  ) {
    failV01("operational_reentry_probe_fingerprint_invalid");
  }
}

function sealV01<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV01 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(value),
      ),
    },
  };
}

function timestampV01(value: unknown): number {
  if (typeof value !== "string") {
    failV01("operational_reentry_probe_timestamp_invalid");
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    failV01("operational_reentry_probe_timestamp_invalid");
  }
  return parsed;
}

function exactKeysV01(
  value: Record<string, unknown>,
  keys: string[],
): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...keys].sort())
  ) {
    failV01("operational_reentry_probe_authorization_missing_or_malformed");
  }
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failV01(code: string): never {
  throw new OperationalReentryProviderCompatibilityProbeErrorV01(code);
}
