import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  operationalReentryMatchedCohortCaseFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  assertModelGatewayCostBudgetCurrentV01,
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
  isModelGatewayInvocationErrorV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03,
  invokeOperationalReentryMatchedCohortModelGatewayV03,
  projectOperationalReentryMatchedCohortProviderRequestV03,
  readOperationalReentryMatchedCohortProviderContractV03,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryMatchedCohortModelGatewayDependenciesV03,
} from "@/lib/vnext/model-gateway/model-gateway";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01,
  MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01,
  MODEL_PROVIDER_RESPONSE_STATUSES_V01,
  MODEL_PROVIDER_INCOMPLETE_REASONS_V01,
} from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import { buildOperationalReentryMatchedCohortModelInputV03 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  type OperationalReentryMatchedCohortCaseV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
  type OperationalReentryMatchedCohortIntegrityV03,
  type OperationalReentryMatchedCohortRouteV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
  type OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeOutcomeV01,
  type OperationalReentryParserClosedProviderCompatibilityProbePlanArtifactEntryV01,
  type OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01,
  type OperationalReentryParserClosedProviderCompatibilityProbePlanV01,
  type OperationalReentryParserClosedProviderCompatibilityProbePreparedV01,
  type OperationalReentryParserClosedProviderCompatibilityProbePricingV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeReportV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeShapeV01,
  type OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01,
} from "@/types/vnext/operational-reentry-parser-closed-provider-compatibility-probe";

export const ACGC_E2R2P4H_ISSUE_NUMBER_V01 = 214 as const;
export const ACGC_E2R2P3H_MERGE_SHA_V01 =
  "8fb239d05d0839e64c7975539dd4c5bdcea8d772" as const;
export const ACGC_E2R2P2_SOURCE_SHA_V01 =
  "7d78b2143ba7377683ba21b4844face71c814605" as const;
export const ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01 = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);
export const ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01 =
  250_000_000 as const;
export const ACGC_E2R2P4H_AGGREGATE_WORST_CASE_COST_NANO_USD_V01 =
  (OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes *
    400 +
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens *
      1_600) *
  4;
export const ACGC_E2R2P4H_PRICING_EFFECTIVE_AT_V01 =
  "2026-08-19T00:00:00.000Z" as const;
export const ACGC_E2R2P4H_PRICING_EXPIRES_AT_V01 =
  "2026-08-26T00:00:00.000Z" as const;
export const ACGC_E2R2P4H_PROBE_OUTCOMES_V01 = Object.freeze([
  "accepted_all_shapes",
  "provider_rejected",
  "provider_response_invalid",
  "transport_or_runtime_incomplete",
  "not_run",
] as const);
export const ACGC_E2R2P4H_TERMINAL_CATEGORIES_V01 = Object.freeze([
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
export const operationalReentryParserClosedProviderCompatibilityProbeHarnessAuthorityV01 =
  Object.freeze({
    successor_live_authorization_granted: false as const,
    successor_live_authorization_consumed: false as const,
    real_provider_calls: 0 as const,
    successor_compatibility_result: "none" as const,
    behavioral_cohort_authorized: false as const,
    replication_authorized: false as const,
    policy_authorized: false as const,
    stage_7_authorized: false as const,
  });

const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;
const SAFE_AUTHORIZATION_ID_V01 = /^[A-Za-z0-9:._-]{1,200}$/u;
const AUTHORIZED_REPOSITORY_SLUG_V01 =
  "hynk-studio/augnes" as const;
const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);

export class OperationalReentryParserClosedProviderCompatibilityProbeErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryParserClosedProviderCompatibilityProbeErrorV01";
  }
}

export interface BuildOperationalReentryParserClosedProviderCompatibilityProbeInputV01 {
  authorization: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV03;
  repository_identity: {
    repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V01;
    origin: string;
  };
  evaluated_at: string;
}

export interface RunOperationalReentryParserClosedProviderCompatibilityProbeDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV03;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV03;
  cancellation_signal?: AbortSignal;
  assert_source_unchanged: (
    entry: OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01,
  ) => void | Promise<void>;
  consume_authorization: (input: {
    authorization: OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01;
    probe_id: string;
  }) => void;
  on_shape_terminal?: (
    shape: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01,
  ) => void | Promise<void>;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationExpectationsV01 {
  repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V01;
  authorized_origin:
    "https://github.com/hynk-studio/augnes.git";
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: number;
  project_root_fingerprint: string;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  representative_shape_plan_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  response_bytes: number;
  max_output_tokens: number;
  pricing_fingerprint: string;
  pricing_snapshot_evaluated_at: string;
  pricing_authority_fingerprint: string;
  pricing_authority_expires_at: string;
  aggregate_worst_case_cost_nano_usd: number;
}

export function buildOperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01(
  caseInput: OperationalReentryMatchedCohortCaseV02 =
    operationalReentryMatchedCohortCaseFixtureV02,
): OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01 {
  assertSealedV01(caseInput);
  const entries = ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01.map(
    (shape, canonicalOrder) => {
      const callSlotId = `e2r2p4h-call-${String(canonicalOrder).padStart(2, "0")}-${fingerprintV01({
        family: "parser_closed_compatibility_probe",
        case_fingerprint: caseInput.integrity.fingerprint,
        canonical_order: canonicalOrder,
        shape,
      }).slice("sha256:".length, "sha256:".length + 12)}`;
      const modelInput = buildOperationalReentryMatchedCohortModelInputV03({
        case_input: caseInput,
        arm: shape,
        block: 0,
        call_slot_id: callSlotId,
      });
      modelInput.invocation_context.cohort_ref =
        "acgc-e2r2p4h-parser-closed-compatibility-v03";
      const request =
        projectOperationalReentryMatchedCohortProviderRequestV03(modelInput);
      const nonTargetContinuation = modelInput.continuation_context.filter(
        (item) => item.role === "non_target",
      );
      return {
        canonical_order: canonicalOrder as 0 | 1 | 2 | 3,
        shape,
        call_slot_id: callSlotId,
        representative_input_fingerprint: fingerprintV01(modelInput),
        common_task_evidence_fingerprint: fingerprintV01(
          modelInput.common_task_evidence,
        ),
        non_target_continuation_fingerprint: fingerprintV01(
          nonTargetContinuation,
        ),
        treatment_material_fingerprint: fingerprintV01({
          continuation_context: modelInput.continuation_context,
          stale_relation: modelInput.stale_relation,
        }),
        schema_fingerprint: request.schema_fingerprint,
        provider_visible_request_fingerprint: request.request_fingerprint,
        adapter_request_route_fingerprint:
          request.adapter_request_route_fingerprint,
        model_input: modelInput,
        strict_schema_preflight: "passed" as const,
      };
    },
  );
  return sealV01("parser_closed_representative_shape_plan_without_integrity_fingerprint", {
    representative_plan_version:
      "operational_reentry_parser_closed_representative_shape_plan.v0.1" as const,
    case_fingerprint: caseInput.integrity.fingerprint,
    common_task_evidence_fingerprint:
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    canonical_order: ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01,
    entries,
  });
}

export function buildOperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01(
  route: OperationalReentryMatchedCohortRouteV03,
): OperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01 {
  assertExactRouteV01(route);
  const contract = readOperationalReentryMatchedCohortProviderContractV03();
  if (route.provider_contract_fingerprint !== contract.integrity.fingerprint) {
    failV01("parser_closed_probe_provider_contract_mismatch");
  }
  return structuredClone(contract);
}

export function buildOperationalReentryParserClosedProviderCompatibilityProbePricingV01(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV03;
    evaluated_at: string;
  },
): OperationalReentryParserClosedProviderCompatibilityProbePricingV01 {
  assertExactRouteV01(input.route);
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 400 },
    output_rate: { unit: "token", cost_per_unit: 1_600 },
    pricing_source_version:
      "openai_gpt-4.1-mini-2025-04-14_2026-08-19",
    pricing_effective_at: ACGC_E2R2P4H_PRICING_EFFECTIVE_AT_V01,
    pricing_expires_at: ACGC_E2R2P4H_PRICING_EXPIRES_AT_V01,
    project_model_policy_fingerprint: input.route.integrity_fingerprint,
  });
  const budget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens,
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.timeoutMs,
    maximum_permitted_cost:
      ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01,
    evaluated_at: input.evaluated_at,
  });
  assertModelGatewayCostBudgetCurrentV01(budget, input.evaluated_at);
  const aggregateWorstCase = budget.calculated_worst_case_cost * 4;
  if (
    !Number.isSafeInteger(aggregateWorstCase) ||
    aggregateWorstCase !==
      ACGC_E2R2P4H_AGGREGATE_WORST_CASE_COST_NANO_USD_V01 ||
    aggregateWorstCase >
      ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01
  ) {
    failV01("parser_closed_probe_aggregate_cost_ceiling_exceeded");
  }
  return sealV01("parser_closed_probe_pricing_without_integrity_fingerprint", {
    pricing_version:
      OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01,
    provider_ref: structuredClone(input.route.provider_ref),
    model_ref: structuredClone(input.route.model_ref),
    route_fingerprint: input.route.integrity_fingerprint,
    pricing_source: "official_openai_model_page" as const,
    pricing_source_url:
      "https://developers.openai.com/api/docs/models/gpt-4.1-mini" as const,
    pricing_source_version: authority.pricing_source_version,
    pricing_effective_at: ACGC_E2R2P4H_PRICING_EFFECTIVE_AT_V01,
    pricing_expires_at: ACGC_E2R2P4H_PRICING_EXPIRES_AT_V01,
    evaluated_at: input.evaluated_at,
    input_nano_usd_per_token: 400 as const,
    cached_input_nano_usd_per_token: 100 as const,
    output_nano_usd_per_token: 1_600 as const,
    gateway_cost_budget: budget,
    per_shape_worst_case_cost_nano_usd: budget.calculated_worst_case_cost,
    aggregate_worst_case_cost_nano_usd: aggregateWorstCase,
    aggregate_ceiling_nano_usd:
      ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01,
    missing_usage_or_exact_cost: "unknown_never_zero" as const,
  });
}

export function buildOperationalReentryParserClosedProviderCompatibilityProbeAuthorizationExpectationsV01(
  input: Omit<BuildOperationalReentryParserClosedProviderCompatibilityProbeInputV01, "authorization">,
): OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationExpectationsV01 {
  const origin = authorizedOriginV01(input.repository_identity.origin);
  const representativeShapePlan =
    buildOperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01();
  const providerContract =
    buildOperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01(
      input.route,
    );
  const pricing =
    buildOperationalReentryParserClosedProviderCompatibilityProbePricingV01(
      input,
    );
  return {
    repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
    authorized_origin: origin,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    expected_active_selection_revision:
      input.admission.expected_active_selection_revision,
    project_root_fingerprint: fingerprintV01(input.admission.project_root),
    case_fingerprint:
      operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
    common_task_evidence_fingerprint:
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    representative_shape_plan_fingerprint:
      representativeShapePlan.integrity.fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    provider_contract_fingerprint: providerContract.integrity.fingerprint,
    adapter_request_route_fingerprint:
      representativeShapePlan.entries[0]!.adapter_request_route_fingerprint,
    response_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.responseBytes,
    max_output_tokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens,
    pricing_fingerprint: pricing.integrity.fingerprint,
    pricing_snapshot_evaluated_at: pricing.evaluated_at,
    pricing_authority_fingerprint:
      pricing.gateway_cost_budget.authority.pricing_fingerprint,
    pricing_authority_expires_at: pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      pricing.aggregate_worst_case_cost_nano_usd,
  };
}

export function validateOperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01(
  value: unknown,
  input: Omit<BuildOperationalReentryParserClosedProviderCompatibilityProbeInputV01, "authorization">,
): OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01 {
  if (!isRecordV01(value)) {
    failV01("parser_closed_probe_authorization_missing_or_malformed");
  }
  exactKeysV01(value, [
    "authorization_version",
    "authorization_id",
    "authorization_kind",
    "request_family_kind",
    "future_live_issue_number",
    "exact_merged_source_head",
    "repository_slug",
    "authorized_origin",
    "issued_at",
    "expires_at",
    "workspace_id",
    "project_id",
    "expected_active_selection_revision",
    "project_root_fingerprint",
    "gateway_authorization_project_is_lab_experiment_meaning",
    "case_fingerprint",
    "common_task_evidence_fingerprint",
    "representative_shape_plan_fingerprint",
    "route_fingerprint",
    "provider_contract_fingerprint",
    "adapter_request_route_fingerprint",
    "provider_contract_version",
    "codec_version",
    "response_schema_version",
    "parser_version",
    "adapter_implementation_id",
    "adapter_implementation_version",
    "response_invalid_observation_version",
    "response_bytes",
    "max_output_tokens",
    "pricing_fingerprint",
    "pricing_snapshot_evaluated_at",
    "pricing_authority_fingerprint",
    "pricing_authority_expires_at",
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
    "adaptive_prompt_schema_or_input_changes",
    "stop_after_first_non_success_terminal_result",
    "second_probe_authorized",
    "issue_208_authorization_reuse",
    "behavioral_cohort_authorized",
    "replication_authorized",
    "policy_authorized",
    "stage_7_authorized",
    "maximum_total_cost_nano_usd",
    "integrity",
  ]);
  const authorization = structuredClone(
    value,
  ) as unknown as OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01;
  assertSealedV01(authorization);
  const pricingSnapshotAt = timestampV01(
    authorization.pricing_snapshot_evaluated_at,
  );
  const expectations =
    buildOperationalReentryParserClosedProviderCompatibilityProbeAuthorizationExpectationsV01(
      {
        ...input,
        evaluated_at: authorization.pricing_snapshot_evaluated_at,
      },
    );
  const currentPricing =
    buildOperationalReentryParserClosedProviderCompatibilityProbePricingV01(
      input,
    );
  const issuedAt = timestampV01(authorization.issued_at);
  const expiresAt = timestampV01(authorization.expires_at);
  const evaluatedAt = timestampV01(input.evaluated_at);
  const pricingExpiresAt = timestampV01(
    authorization.pricing_authority_expires_at,
  );
  if (
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01 ||
    !SAFE_AUTHORIZATION_ID_V01.test(authorization.authorization_id) ||
    authorization.authorization_kind !==
      "one_bounded_parser_closed_provider_compatibility_probe" ||
    authorization.request_family_kind !==
      "parser_closed_compatibility_probe" ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= ACGC_E2R2P4H_ISSUE_NUMBER_V01 ||
    !GIT_SHA_V01.test(authorization.exact_merged_source_head) ||
    authorization.exact_merged_source_head === ACGC_E2R2P3H_MERGE_SHA_V01 ||
    authorization.exact_merged_source_head === ACGC_E2R2P2_SOURCE_SHA_V01 ||
    authorization.repository_slug !== expectations.repository_slug ||
    authorization.authorized_origin !== expectations.authorized_origin ||
    authorization.workspace_id !== expectations.workspace_id ||
    authorization.project_id !== expectations.project_id ||
    authorization.expected_active_selection_revision !==
      expectations.expected_active_selection_revision ||
    authorization.project_root_fingerprint !==
      expectations.project_root_fingerprint ||
    authorization.gateway_authorization_project_is_lab_experiment_meaning !==
      false ||
    authorization.case_fingerprint !== expectations.case_fingerprint ||
    authorization.common_task_evidence_fingerprint !==
      expectations.common_task_evidence_fingerprint ||
    authorization.representative_shape_plan_fingerprint !==
      expectations.representative_shape_plan_fingerprint ||
    authorization.route_fingerprint !== expectations.route_fingerprint ||
    authorization.provider_contract_fingerprint !==
      expectations.provider_contract_fingerprint ||
    authorization.adapter_request_route_fingerprint !==
      expectations.adapter_request_route_fingerprint ||
    authorization.provider_contract_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03 ||
    authorization.codec_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04 ||
    authorization.response_schema_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04 ||
    authorization.parser_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03 ||
    authorization.adapter_implementation_id !==
      "openai_responses.operational_reentry_matched_cohort" ||
    authorization.adapter_implementation_version !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05 ||
    authorization.response_invalid_observation_version !==
      MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01 ||
    authorization.response_bytes !== expectations.response_bytes ||
    authorization.max_output_tokens !== expectations.max_output_tokens ||
    authorization.pricing_fingerprint !== expectations.pricing_fingerprint ||
    authorization.pricing_snapshot_evaluated_at !==
      expectations.pricing_snapshot_evaluated_at ||
    authorization.pricing_authority_fingerprint !==
      expectations.pricing_authority_fingerprint ||
    authorization.pricing_authority_fingerprint !==
      currentPricing.gateway_cost_budget.authority.pricing_fingerprint ||
    authorization.pricing_authority_expires_at !==
      expectations.pricing_authority_expires_at ||
    authorization.planned_shapes !== 4 ||
    canonicalizeProtocolValueV01(authorization.canonical_order) !==
      canonicalizeProtocolValueV01(
        ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01,
      ) ||
    authorization.maximum_provider_calls !== 4 ||
    authorization.maximum_parallel_calls !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacement_calls !== 0 ||
    authorization.fresh_stateless_request_per_shape !== true ||
    authorization.conversation_reuse !== false ||
    authorization.thread_reuse !== false ||
    authorization.previous_response_reuse !== false ||
    authorization.adaptive_prompt_schema_or_input_changes !== false ||
    authorization.stop_after_first_non_success_terminal_result !== true ||
    authorization.second_probe_authorized !== false ||
    authorization.issue_208_authorization_reuse !== false ||
    authorization.behavioral_cohort_authorized !== false ||
    authorization.replication_authorized !== false ||
    authorization.policy_authorized !== false ||
    authorization.stage_7_authorized !== false ||
    authorization.maximum_total_cost_nano_usd !==
      ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01 ||
    expectations.aggregate_worst_case_cost_nano_usd >
      authorization.maximum_total_cost_nano_usd ||
    pricingSnapshotAt > issuedAt ||
    issuedAt >= expiresAt ||
    expiresAt - issuedAt > 2 * 60 * 60 * 1000 ||
    evaluatedAt < issuedAt ||
    evaluatedAt >= expiresAt ||
    expiresAt > pricingExpiresAt
  ) {
    failV01("parser_closed_probe_authorization_mismatched");
  }
  return authorization;
}

export function buildOperationalReentryParserClosedProviderCompatibilityProbeV01(
  input: BuildOperationalReentryParserClosedProviderCompatibilityProbeInputV01,
): OperationalReentryParserClosedProviderCompatibilityProbePreparedV01 {
  const authorization =
    validateOperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01(
      input.authorization,
      input,
    );
  const caseValue = structuredClone(
    operationalReentryMatchedCohortCaseFixtureV02,
  );
  const representativeShapePlan =
    buildOperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01(
      caseValue,
    );
  const providerContract =
    buildOperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01(
      input.route,
    );
  const pricing =
    buildOperationalReentryParserClosedProviderCompatibilityProbePricingV01({
      admission: input.admission,
      route: input.route,
      evaluated_at: authorization.pricing_snapshot_evaluated_at,
    });
  const requestFamilyBasisFingerprint = fingerprintV01({
    authorization_fingerprint: authorization.integrity.fingerprint,
    representative_shape_plan_fingerprint:
      representativeShapePlan.integrity.fingerprint,
    request_family_kind: "parser_closed_compatibility_probe",
  });
  const entries: OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01[] =
    representativeShapePlan.entries.map((entry) => {
      const traceFingerprint = fingerprintV01({
        request_family_basis_fingerprint: requestFamilyBasisFingerprint,
        canonical_order: entry.canonical_order,
        shape: entry.shape,
        call_slot_id: entry.call_slot_id,
      });
      const requestFamilyTraceId =
        createDeterministicModelProviderRequestTraceV01({
          request_family_kind: "parser_closed_compatibility_probe",
          request_family_fingerprint: traceFingerprint,
        });
      return {
        ...structuredClone(entry),
        request_family_trace_id: requestFamilyTraceId,
        client_request_id: createDeterministicModelClientRequestIdV01({
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
          provider_request_trace_id: requestFamilyTraceId,
          call_slot_id: entry.call_slot_id,
          model: input.route.model_ref.external_id,
        }),
      };
    });
  const plan = sealV01("parser_closed_probe_plan_without_integrity_fingerprint", {
    plan_version:
      OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01,
    authorization_fingerprint: authorization.integrity.fingerprint,
    source_repository_head_sha: authorization.exact_merged_source_head,
    future_live_issue_number: authorization.future_live_issue_number,
    request_family_kind: "parser_closed_compatibility_probe" as const,
    request_family_basis_fingerprint: requestFamilyBasisFingerprint,
    representative_shape_plan_fingerprint:
      representativeShapePlan.integrity.fingerprint,
    canonical_order: ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01,
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
  const probeId =
    `operational-reentry-parser-closed-provider-probe:${fingerprintV01({
      authorization_fingerprint: authorization.integrity.fingerprint,
      plan_fingerprint: plan.integrity.fingerprint,
    }).slice("sha256:".length, "sha256:".length + 32)}`;
  const manifest = sealV01(
    "parser_closed_probe_manifest_without_integrity_fingerprint",
    {
      manifest_version:
        OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_MANIFEST_VERSION_V01,
      probe_version:
        OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
      probe_id: probeId,
      future_live_issue_number: authorization.future_live_issue_number,
      source_repository_head_sha: authorization.exact_merged_source_head,
      authorization_fingerprint: authorization.integrity.fingerprint,
      source_ref: structuredClone(caseValue.source_ref),
      case_fingerprint: caseValue.integrity.fingerprint,
      common_task_evidence_fingerprint:
        OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
      representative_shape_plan_fingerprint:
        representativeShapePlan.integrity.fingerprint,
      plan_fingerprint: plan.integrity.fingerprint,
      route: structuredClone(input.route),
      provider_contract_fingerprint: providerContract.integrity.fingerprint,
      adapter_request_route_fingerprint:
        representativeShapePlan.entries[0]!.adapter_request_route_fingerprint,
      response_invalid_observation_version:
        MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01,
      response_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.responseBytes as 1168,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens as 1168,
      pricing_fingerprint: pricing.integrity.fingerprint,
      pricing_authority_fingerprint:
        pricing.gateway_cost_budget.authority.pricing_fingerprint,
      request_family_kind: "parser_closed_compatibility_probe" as const,
      provider_egress:
        "allow_only_with_supplied_future_authorization" as const,
      execution_mode: "live" as const,
      data_classification: "public_safe" as const,
      retention_class: "none" as const,
      raw_prompt_persisted: false as const,
      raw_request_body_persisted: false as const,
      raw_provider_response_persisted: false as const,
      raw_provider_error_persisted: false as const,
      hidden_reasoning_persisted: false as const,
      credentials_or_full_headers_persisted: false as const,
      manual_retries: 0 as const,
      replacement_calls: 0 as const,
    },
  );
  const prepared = {
    authorization,
    manifest,
    case: caseValue,
    provider_contract: providerContract,
    representative_shape_plan: representativeShapePlan,
    plan,
    pricing,
  };
  validatePreparedV01(prepared);
  return structuredClone(prepared);
}

export async function runOperationalReentryParserClosedProviderCompatibilityProbeV01(
  input: BuildOperationalReentryParserClosedProviderCompatibilityProbeInputV01,
  dependencies: RunOperationalReentryParserClosedProviderCompatibilityProbeDependenciesV01,
): Promise<OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01> {
  if (
    !dependencies ||
    typeof dependencies.assert_source_unchanged !== "function" ||
    typeof dependencies.consume_authorization !== "function"
  ) {
    failV01("parser_closed_probe_runtime_dependencies_missing");
  }
  const prepared =
    buildOperationalReentryParserClosedProviderCompatibilityProbeV01(input);
  const invokeGateway =
    dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV03;
  const cancellation =
    dependencies.cancellation_signal ?? new AbortController().signal;
  const shapes: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01[] =
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

    let terminal: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01;
    try {
      const result = await invokeGateway(
        buildOperationalReentryParserClosedProviderCompatibilityProbeModelInvocationEnvelopeV01(
          entry,
          prepared,
          input.admission,
          cancellation,
        ),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_v03_route:
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
        failV01("parser_closed_probe_deterministic_or_unobserved_success_refused");
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
  return validateOperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01(
    {
      result_kind:
        report.outcome === "transport_or_runtime_incomplete" ||
        report.outcome === "not_run"
          ? "incomplete"
          : "complete",
      ...prepared,
      shapes,
      report,
    },
  );
}

export function deriveOperationalReentryParserClosedProviderCompatibilityProbeOutcomeV01(
  categories: OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01[],
  sourceUnchangedAtTerminal = true,
): OperationalReentryParserClosedProviderCompatibilityProbeOutcomeV01 {
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

export function projectOperationalReentryParserClosedProviderCompatibilityProbePlanForArtifactV01(
  plan: OperationalReentryParserClosedProviderCompatibilityProbePlanV01,
): Omit<OperationalReentryParserClosedProviderCompatibilityProbePlanV01, "entries"> & {
  entries: OperationalReentryParserClosedProviderCompatibilityProbePlanArtifactEntryV01[];
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

export function validateOperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01(
  result: OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01,
): OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01 {
  validatePreparedV01(result);
  assertSealedV01(result.report);
  result.shapes.forEach(assertSealedV01);
  if (
    result.shapes.length !== 4 ||
    result.shapes.some(
      (shape, index) =>
        shape.canonical_order !== index ||
        shape.shape !== ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01[index] ||
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
    failV01("parser_closed_probe_result_invalid");
  }
  let failureSeen = false;
  for (const shape of result.shapes) {
    if (
      failureSeen &&
      shape.terminal_category !== "not_attempted_after_terminal_failure"
    ) {
      failV01("parser_closed_probe_stop_policy_invalid");
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
    plan: projectOperationalReentryParserClosedProviderCompatibilityProbePlanForArtifactV01(
      result.plan,
    ),
    shapes: result.shapes,
    report: result.report,
  });
  return structuredClone(result);
}

function validatePreparedV01(
  value: OperationalReentryParserClosedProviderCompatibilityProbePreparedV01,
): void {
  [
    value.authorization,
    value.manifest,
    value.case,
    value.provider_contract,
    value.representative_shape_plan,
    value.plan,
    value.pricing,
  ].forEach(assertSealedV01);
  assertExactRouteV01(value.manifest.route);
  const commonEvidenceFingerprints = new Set(
    value.plan.entries.map(
      (entry) => entry.common_task_evidence_fingerprint,
    ),
  );
  const nonTargetByShape = new Map(
    value.plan.entries.map((entry) => [
      entry.shape,
      entry.non_target_continuation_fingerprint,
    ]),
  );
  const dInput = value.plan.entries.find((entry) => entry.shape === "D")
    ?.model_input;
  if (
    value.manifest.authorization_fingerprint !==
      value.authorization.integrity.fingerprint ||
    value.manifest.case_fingerprint !== value.case.integrity.fingerprint ||
    value.manifest.common_task_evidence_fingerprint !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02 ||
    value.manifest.representative_shape_plan_fingerprint !==
      value.representative_shape_plan.integrity.fingerprint ||
    value.authorization.representative_shape_plan_fingerprint !==
      value.representative_shape_plan.integrity.fingerprint ||
    value.manifest.plan_fingerprint !== value.plan.integrity.fingerprint ||
    value.manifest.provider_contract_fingerprint !==
      value.provider_contract.integrity.fingerprint ||
    value.manifest.provider_contract_fingerprint !==
      value.manifest.route.provider_contract_fingerprint ||
    value.authorization.provider_contract_fingerprint !==
      value.provider_contract.integrity.fingerprint ||
    value.manifest.adapter_request_route_fingerprint !==
      value.authorization.adapter_request_route_fingerprint ||
    value.manifest.response_invalid_observation_version !==
      MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01 ||
    value.manifest.response_bytes !== 1168 ||
    value.manifest.max_output_tokens !== 1168 ||
    value.manifest.pricing_fingerprint !== value.pricing.integrity.fingerprint ||
    value.authorization.pricing_fingerprint !==
      value.pricing.integrity.fingerprint ||
    value.authorization.pricing_authority_fingerprint !==
      value.pricing.gateway_cost_budget.authority.pricing_fingerprint ||
    value.authorization.pricing_snapshot_evaluated_at !==
      value.pricing.evaluated_at ||
    value.manifest.request_family_kind !==
      "parser_closed_compatibility_probe" ||
    value.plan.request_family_kind !== "parser_closed_compatibility_probe" ||
    value.plan.entries.length !== 4 ||
    new Set(
      value.plan.entries.map(
        (entry) => entry.adapter_request_route_fingerprint,
      ),
    ).size !== 1 ||
    value.plan.entries[0]?.adapter_request_route_fingerprint !==
      value.authorization.adapter_request_route_fingerprint ||
    commonEvidenceFingerprints.size !== 1 ||
    !commonEvidenceFingerprints.has(
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    ) ||
    nonTargetByShape.get("A") !== nonTargetByShape.get("B") ||
    nonTargetByShape.get("B") !== nonTargetByShape.get("C") ||
    !dInput ||
    dInput.continuation_context.length !== 0 ||
    fingerprintV01(dInput.common_task_evidence) !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02 ||
    new Set(value.plan.entries.map((entry) => entry.call_slot_id)).size !== 4 ||
    new Set(
      value.plan.entries.map((entry) => entry.request_family_trace_id),
    ).size !== 4 ||
    new Set(value.plan.entries.map((entry) => entry.client_request_id)).size !==
      4 ||
    value.plan.entries.some(
      (entry, index) =>
        entry.shape !== ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01[index] ||
        entry.canonical_order !== index ||
        entry.strict_schema_preflight !== "passed" ||
        entry.model_input.invocation_context.call_slot_id !==
          entry.call_slot_id ||
        entry.model_input.invocation_context.cohort_ref !==
          "acgc-e2r2p4h-parser-closed-compatibility-v03" ||
        entry.call_slot_id.startsWith("e2r2p-call-") ||
        entry.call_slot_id.startsWith("e2-call-") ||
        !entry.call_slot_id.startsWith("e2r2p4h-call-"),
    )
  ) {
    failV01("parser_closed_probe_prepared_identity_invalid");
  }
}

export function buildOperationalReentryParserClosedProviderCompatibilityProbeModelInvocationEnvelopeV01(
  entry: OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01,
  prepared: OperationalReentryParserClosedProviderCompatibilityProbePreparedV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id: entry.request_family_trace_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      prepared.case.source_ref.source_fingerprint,
      prepared.case.integrity.fingerprint,
      prepared.representative_shape_plan.integrity.fingerprint,
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
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: prepared.pricing.gateway_cost_budget,
    },
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.timeoutMs,
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
  entry: OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01,
  prepared: OperationalReentryParserClosedProviderCompatibilityProbePreparedV01,
  error: unknown,
): OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01 {
  try {
    const invocationError = isModelGatewayInvocationErrorV01(error)
      ? error
      : null;
    if (
      invocationError?.provider_rejection_observation &&
      (invocationError.provider_rejection_observation.client_request_id !==
        entry.client_request_id ||
        invocationError.provider_rejection_observation.route_fingerprint !==
          entry.adapter_request_route_fingerprint ||
        invocationError.provider_rejection_observation.request_fingerprint !==
          entry.provider_visible_request_fingerprint ||
        invocationError.provider_rejection_observation.schema_fingerprint !==
          entry.schema_fingerprint)
    ) {
      failV01("parser_closed_probe_rejection_identity_mismatch");
    }
    if (
      invocationError?.provider_response_invalid_observation &&
      (invocationError.provider_response_invalid_observation.client_request_id !==
        entry.client_request_id ||
        invocationError.provider_response_invalid_observation.route_fingerprint !==
          entry.adapter_request_route_fingerprint ||
        invocationError.provider_response_invalid_observation.request_fingerprint !==
          entry.provider_visible_request_fingerprint ||
        invocationError.provider_response_invalid_observation.schema_fingerprint !==
          entry.schema_fingerprint)
    ) {
      failV01("parser_closed_probe_response_invalid_identity_mismatch");
    }
    if (
      invocationError?.provider_rejection_observation &&
      invocationError.provider_response_invalid_observation
    ) {
      failV01("parser_closed_probe_terminal_observation_ambiguous");
    }
    return terminalV01({
      entry,
      prepared,
      category: terminalCategoryV01(error),
      receipt: invocationError?.receipt ?? null,
      output: null,
      failure_code:
        invocationError?.code ??
        (error instanceof
        OperationalReentryParserClosedProviderCompatibilityProbeErrorV01
          ? error.code
          : "parser_closed_probe_internal_failure"),
      provider_rejection_observation:
        invocationError?.provider_rejection_observation ?? null,
      provider_response_invalid_observation:
        invocationError?.provider_response_invalid_observation ?? null,
    });
  } catch {
    return terminalV01({
      entry,
      prepared,
      category: "internal_failure",
      receipt: null,
      output: null,
      failure_code: "parser_closed_probe_internal_failure",
      provider_rejection_observation: null,
      provider_response_invalid_observation: null,
    });
  }
}

function terminalCategoryV01(
  error: unknown,
): OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01 {
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
  entry: OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01;
  prepared: OperationalReentryParserClosedProviderCompatibilityProbePreparedV01;
  category: OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01;
  receipt: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01["receipt"];
  output: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01["normalized_output"];
  failure_code: string | null;
  provider_rejection_observation?: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01["provider_rejection_observation"];
  provider_response_invalid_observation?: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01["provider_response_invalid_observation"];
}): OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01 {
  if (
    (input.provider_rejection_observation !== undefined &&
      input.provider_rejection_observation !== null) !==
      (input.category === "provider_rejected") ||
    (input.provider_response_invalid_observation !== undefined &&
      input.provider_response_invalid_observation !== null) &&
      input.category !== "provider_response_invalid"
  ) {
    failV01("parser_closed_probe_terminal_observation_mismatch");
  }
  if (input.provider_response_invalid_observation) {
    validateResponseInvalidObservationV01(
      input.provider_response_invalid_observation,
    );
  }
  const receipt = input.receipt
    ? validateModelInvocationReceiptV02(input.receipt)
    : null;
  const usage = receipt?.usage ?? null;
  const outputFingerprint = input.output
    ? fingerprintV01(input.output)
    : null;
  if (
    receipt &&
    (receipt.purpose !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 ||
      receipt.invocation_id !== input.entry.call_slot_id ||
      (input.output !== null &&
        receipt.normalized_output_fingerprint !== outputFingerprint))
  ) {
    failV01("parser_closed_probe_receipt_binding_invalid");
  }
  const exactCost =
    usage && usage.cached_input_tokens !== undefined
      ? {
          status: "calculated" as const,
          input_nano_usd:
            (usage.input_tokens - usage.cached_input_tokens) * 400 +
            usage.cached_input_tokens * 100,
          output_nano_usd: usage.output_tokens * 1_600,
          total_nano_usd:
            (usage.input_tokens - usage.cached_input_tokens) * 400 +
            usage.cached_input_tokens * 100 +
            usage.output_tokens * 1_600,
        }
      : {
          status: "unknown" as const,
          input_nano_usd: null,
          output_nano_usd: null,
          total_nano_usd: null,
        };
  return sealV01("parser_closed_probe_shape_terminal_without_integrity_fingerprint", {
    canonical_order: input.entry.canonical_order,
    shape: input.entry.shape,
    call_slot_id: input.entry.call_slot_id,
    terminal_category: input.category,
    egress_attempted: receipt?.egress_attempted ?? false,
    request_family_kind: "parser_closed_compatibility_probe" as const,
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
    provider_rejection_observation: input.provider_rejection_observation
      ? structuredClone(input.provider_rejection_observation)
      : null,
    provider_response_invalid_observation:
      input.provider_response_invalid_observation
        ? structuredClone(input.provider_response_invalid_observation)
        : null,
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

function validateResponseInvalidObservationV01(value: unknown): void {
  if (!isRecordV01(value)) {
    failV01("parser_closed_probe_response_invalid_observation_malformed");
  }
  exactKeysV01(value, [
    "observation_version",
    "stage",
    "provider_status",
    "incomplete_reason",
    "output_text_present",
    "provider_request_id",
    "client_request_id",
    "route_fingerprint",
    "request_fingerprint",
    "schema_fingerprint",
  ]);
  if (
    value.observation_version !==
      MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01 ||
    !MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01.includes(
      value.stage as (typeof MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01)[number],
    ) ||
    (value.provider_status !== null &&
      !MODEL_PROVIDER_RESPONSE_STATUSES_V01.includes(
        value.provider_status as (typeof MODEL_PROVIDER_RESPONSE_STATUSES_V01)[number],
      )) ||
    (value.incomplete_reason !== null &&
      !MODEL_PROVIDER_INCOMPLETE_REASONS_V01.includes(
        value.incomplete_reason as (typeof MODEL_PROVIDER_INCOMPLETE_REASONS_V01)[number],
      )) ||
    typeof value.output_text_present !== "boolean" ||
    (value.provider_request_id !== null &&
      (typeof value.provider_request_id !== "string" ||
        !/^[A-Za-z0-9:._/-]{1,160}$/u.test(value.provider_request_id))) ||
    typeof value.client_request_id !== "string" ||
    !/^[A-Za-z0-9:._/-]{1,160}$/u.test(value.client_request_id) ||
    !SHA256_V01.test(value.route_fingerprint as string) ||
    !SHA256_V01.test(value.request_fingerprint as string) ||
    !SHA256_V01.test(value.schema_fingerprint as string)
  ) {
    failV01("parser_closed_probe_response_invalid_observation_malformed");
  }
}

function buildReportV01(
  probeId: string,
  shapes: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01[],
  pricing: OperationalReentryParserClosedProviderCompatibilityProbePricingV01,
  sourceUnchangedAtTerminal: boolean,
  authorizationConsumed: boolean,
): OperationalReentryParserClosedProviderCompatibilityProbeReportV01 {
  const categories = shapes.map((shape) => shape.terminal_category);
  const outcome =
    deriveOperationalReentryParserClosedProviderCompatibilityProbeOutcomeV01(
      categories,
      sourceUnchangedAtTerminal,
    );
  const counts = Object.fromEntries(
    ACGC_E2R2P4H_TERMINAL_CATEGORIES_V01.map((category) => [
      category,
      categories.filter((value) => value === category).length,
    ]),
  ) as Record<
    OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01,
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
  return sealV01("parser_closed_probe_report_without_integrity_fingerprint", {
    report_version:
      OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01,
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
    accepted_and_normalized_shapes: counts.accepted_and_normalized,
    not_attempted_after_terminal_failure:
      counts.not_attempted_after_terminal_failure,
    source_head_and_tracked_worktree_unchanged_at_terminal:
      sourceUnchangedAtTerminal,
    authorization_consumed: authorizationConsumed,
    first_terminal_failure: firstFailure,
    terminal_category_counts: counts,
    exact_cost: {
      status: allExactCostsKnown ? "calculated" as const : "unknown" as const,
      calculated_total_nano_usd: allExactCostsKnown
        ? (exactCosts as number[]).reduce((sum, value) => sum + value, 0)
        : null,
      aggregate_worst_case_cost_nano_usd:
        pricing.aggregate_worst_case_cost_nano_usd,
      aggregate_ceiling_nano_usd:
        ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01,
      missing_usage_or_exact_cost: "unknown_never_zero" as const,
    },
    real_provider_calls_observed_by_harness: null,
    compatibility_scope_boundary: {
      accepted_all_shapes_means_provider_contract_only: true as const,
      normalized_outputs_reused_as_behavioral_evidence: false as const,
      behavioral_evaluator_built_or_invoked: false as const,
      e1_evaluator_built_or_invoked: false as const,
      pairwise_or_conditioning_reset_generated: false as const,
      continuation_benefit_or_harm_claim_generated: false as const,
      rank_or_winner_generated: false as const,
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
      authorizes_behavioral_cohort: false as const,
      authorizes_replication: false as const,
      authorizes_policy: false as const,
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
      "accepted_all_shapes means only provider acceptance and local parser-closed v0.3 normalization for the four representative shapes.",
      "Compatibility output is not behavioral input or evidence and creates no E1, pairwise, conditioning, reset, continuation benefit, or continuation harm conclusion.",
      "A successful probe is not cohort, replication, policy, Stage 7, publication, Ready, or merge authority.",
      "Missing provider usage or exact cost remains unknown and is never interpreted as zero.",
    ],
  });
}

function readProviderBoundaryV01() {
  const representative =
    buildOperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01()
      .entries[0];
  if (!representative) failV01("parser_closed_probe_shape_missing");
  return projectOperationalReentryMatchedCohortProviderRequestV03(
    representative.model_input,
  );
}

function assertExactRouteV01(
  route: OperationalReentryMatchedCohortRouteV03,
): void {
  const boundary = readProviderBoundaryV01();
  const { integrity_fingerprint: fingerprint, ...withoutFingerprint } = route;
  if (
    route.gateway_version !== MODEL_GATEWAY_VERSION_V01 ||
    route.purpose !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 ||
    route.provider_ref.external_id !== "openai" ||
    route.model_ref.external_id !== "gpt-4.1-mini-2025-04-14" ||
    route.model_ref.external_id !== boundary.model ||
    route.adapter_implementation_id !== boundary.adapter_implementation_id ||
    route.adapter_implementation_version !==
      boundary.adapter_implementation_version ||
    route.provider_contract_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03 ||
    route.provider_contract_fingerprint !==
      "sha256:682905683f083ee67002dc4cf2577ec3ae4302e90fc85e27f43019b8b7978bbb" ||
    route.provider_contract_fingerprint !==
      readOperationalReentryMatchedCohortProviderContractV03().integrity
        .fingerprint ||
    boundary.adapter_request_route_fingerprint !==
      "sha256:182e0be9c2b4a53baca61c01d9b83f67fbd6855d1e3b8c9cbd182abeff4831e9" ||
    route.response_bytes !== 1168 ||
    route.max_output_tokens !== 1168 ||
    route.maximum_canonical_wire_response_bytes !== 656 ||
    route.response_safety_margin_bytes !== 512 ||
    route.prepared_without_provider_egress !== true ||
    fingerprint !== fingerprintV01(withoutFingerprint)
  ) {
    failV01("parser_closed_probe_route_mismatch");
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
    "e1_evaluation",
    "pairwise_relations",
  ]) {
    if (text.includes(forbidden)) {
      failV01("parser_closed_probe_forbidden_material");
    }
  }
}

function authorizedOriginV01(
  value: string,
): OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationExpectationsV01["authorized_origin"] {
  if (!AUTHORIZED_ORIGINS_V01.has(value)) {
    failV01("parser_closed_probe_repository_origin_mismatch");
  }
  return value as OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationExpectationsV01["authorized_origin"];
}

function assertSealedV01(value: {
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}): void {
  const { integrity, ...withoutIntegrity } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    !SHA256_V01.test(integrity.fingerprint) ||
    integrity.fingerprint !== fingerprintV01(withoutIntegrity)
  ) {
    failV01("parser_closed_probe_fingerprint_invalid");
  }
}

function sealV01<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV03 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: fingerprintV01(value),
    },
  };
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function timestampV01(value: unknown): number {
  if (typeof value !== "string") {
    failV01("parser_closed_probe_timestamp_invalid");
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    failV01("parser_closed_probe_timestamp_invalid");
  }
  return parsed;
}

function exactKeysV01(value: Record<string, unknown>, keys: string[]): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...keys].sort())
  ) {
    failV01("parser_closed_probe_authorization_missing_or_malformed");
  }
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failV01(code: string): never {
  throw new OperationalReentryParserClosedProviderCompatibilityProbeErrorV01(
    code,
  );
}
