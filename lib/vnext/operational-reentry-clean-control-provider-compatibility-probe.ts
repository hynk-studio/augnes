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
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
  isModelGatewayInvocationErrorV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02,
  invokeOperationalReentryMatchedCohortModelGatewayV02,
  projectOperationalReentryMatchedCohortProviderRequestV02,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryMatchedCohortModelGatewayDependenciesV02,
} from "@/lib/vnext/model-gateway/model-gateway";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import { buildOperationalReentryMatchedCohortModelInputV02 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
  type OperationalReentryMatchedCohortCaseV02,
  type OperationalReentryMatchedCohortIntegrityV02,
  type OperationalReentryMatchedCohortRouteV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_MANIFEST_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_PROVIDER_CONTRACT_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_VERSION_V02,
  type OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeOutcomeV02,
  type OperationalReentryCleanControlProviderCompatibilityProbePlanArtifactEntryV02,
  type OperationalReentryCleanControlProviderCompatibilityProbePlanEntryV02,
  type OperationalReentryCleanControlProviderCompatibilityProbePlanV02,
  type OperationalReentryCleanControlProviderCompatibilityProbePreparedV02,
  type OperationalReentryCleanControlProviderCompatibilityProbePricingV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeProviderContractV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeReportV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeShapeV02,
  type OperationalReentryCleanControlProviderCompatibilityProbeTerminalCategoryV02,
} from "@/types/vnext/operational-reentry-clean-control-provider-compatibility-probe";

export const ACGC_E2R2P1_ISSUE_NUMBER_V02 = 206 as const;
export const ACGC_E2R2H_MERGE_SHA_V02 =
  "224da0e8210396cd00854133094467265e48d29b" as const;
export const ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02 = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);
export const ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02 =
  250_000_000 as const;
export const ACGC_E2R2P1_AGGREGATE_WORST_CASE_COST_NANO_USD_V02 =
  (OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes *
    400 +
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens *
      1_600) *
  4;
export const ACGC_E2R2P1_PRICING_EFFECTIVE_AT_V02 =
  "2026-08-19T00:00:00.000Z" as const;
export const ACGC_E2R2P1_PRICING_EXPIRES_AT_V02 =
  "2026-08-26T00:00:00.000Z" as const;
export const ACGC_E2R2P1_PROBE_OUTCOMES_V02 = Object.freeze([
  "accepted_all_shapes",
  "provider_rejected",
  "provider_response_invalid",
  "transport_or_runtime_incomplete",
  "not_run",
] as const);
export const ACGC_E2R2P1_TERMINAL_CATEGORIES_V02 = Object.freeze([
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
export const operationalReentryCleanControlProviderCompatibilityProbeHarnessAuthorityV02 =
  Object.freeze({
    live_probe_authorization_granted: false as const,
    live_probe_authorization_consumed: false as const,
    real_provider_calls: 0 as const,
    compatibility_result_exists: false as const,
    behavioral_cohort_authorized: false as const,
    replication_authorized: false as const,
    policy_authorized: false as const,
    stage_7_authorized: false as const,
  });

const GIT_SHA_V02 = /^[0-9a-f]{40}$/u;
const SHA256_V02 = /^sha256:[0-9a-f]{64}$/u;
const SAFE_AUTHORIZATION_ID_V02 = /^[A-Za-z0-9:._-]{1,200}$/u;
const AUTHORIZED_REPOSITORY_SLUG_V02 =
  "hynk-studio/augnes" as const;
const AUTHORIZED_ORIGINS_V02 = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);

export class OperationalReentryCleanControlProviderCompatibilityProbeErrorV02 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryCleanControlProviderCompatibilityProbeErrorV02";
  }
}

export interface BuildOperationalReentryCleanControlProviderCompatibilityProbeInputV02 {
  authorization: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV02;
  repository_identity: {
    repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V02;
    origin: string;
  };
  evaluated_at: string;
}

export interface RunOperationalReentryCleanControlProviderCompatibilityProbeDependenciesV02 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV02;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV02;
  cancellation_signal?: AbortSignal;
  assert_source_unchanged: (
    entry: OperationalReentryCleanControlProviderCompatibilityProbePlanEntryV02,
  ) => void | Promise<void>;
  consume_authorization: (input: {
    authorization: OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02;
    probe_id: string;
  }) => void;
  on_shape_terminal?: (
    shape: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02,
  ) => void | Promise<void>;
}

export interface OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02 {
  repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V02;
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
  pricing_fingerprint: string;
  pricing_snapshot_evaluated_at: string;
  pricing_authority_fingerprint: string;
  pricing_authority_expires_at: string;
  aggregate_worst_case_cost_nano_usd: number;
}

export function buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02(
  caseInput: OperationalReentryMatchedCohortCaseV02 =
    operationalReentryMatchedCohortCaseFixtureV02,
): OperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02 {
  assertSealedV02(caseInput);
  const entries = ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02.map(
    (shape, canonicalOrder) => {
      const callSlotId = `e2r2p-call-${String(canonicalOrder).padStart(2, "0")}-${fingerprintV02({
        family: "clean_control_compatibility_probe",
        case_fingerprint: caseInput.integrity.fingerprint,
        canonical_order: canonicalOrder,
        shape,
      }).slice("sha256:".length, "sha256:".length + 12)}`;
      const modelInput = buildOperationalReentryMatchedCohortModelInputV02({
        case_input: caseInput,
        arm: shape,
        block: 0,
        call_slot_id: callSlotId,
      });
      modelInput.invocation_context.cohort_ref =
        "acgc-e2r2p-clean-control-compatibility-v02";
      const request =
        projectOperationalReentryMatchedCohortProviderRequestV02(modelInput);
      const nonTargetContinuation = modelInput.continuation_context.filter(
        (item) => item.role === "non_target",
      );
      return {
        canonical_order: canonicalOrder as 0 | 1 | 2 | 3,
        shape,
        call_slot_id: callSlotId,
        representative_input_fingerprint: fingerprintV02(modelInput),
        common_task_evidence_fingerprint: fingerprintV02(
          modelInput.common_task_evidence,
        ),
        non_target_continuation_fingerprint: fingerprintV02(
          nonTargetContinuation,
        ),
        treatment_material_fingerprint: fingerprintV02({
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
  return sealV02("clean_control_representative_shape_plan_without_integrity_fingerprint", {
    representative_plan_version:
      "operational_reentry_clean_control_representative_shape_plan.v0.2" as const,
    case_fingerprint: caseInput.integrity.fingerprint,
    common_task_evidence_fingerprint:
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    canonical_order: ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
    entries,
  });
}

export function buildOperationalReentryCleanControlProviderCompatibilityProbeProviderContractV02(
  route: OperationalReentryMatchedCohortRouteV02,
): OperationalReentryCleanControlProviderCompatibilityProbeProviderContractV02 {
  assertExactRouteV02(route);
  const boundary = readProviderBoundaryV02();
  return sealV02("clean_control_probe_provider_contract_without_integrity_fingerprint", {
    provider_contract_identity_version:
      OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_PROVIDER_CONTRACT_VERSION_V02,
    reused_provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
    reused_codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
    strict_schema_supported_subset_version:
      "openai_strict_schema_supported_subset.v0.1" as const,
    response_schema_version: boundary.response_schema_version,
    parser_version: boundary.parser_version,
    adapter_request_route_fingerprint:
      boundary.adapter_request_route_fingerprint,
    provider_ref: structuredClone(route.provider_ref),
    model_ref: structuredClone(route.model_ref),
    adapter_implementation_id: boundary.adapter_implementation_id,
    adapter_implementation_version: boundary.adapter_implementation_version,
    deterministic_fallback_counts_as_success: false as const,
    v01_compatibility_result_reused: false as const,
    behavioral_evaluator_invoked: false as const,
  });
}

export function buildOperationalReentryCleanControlProviderCompatibilityProbePricingV02(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV02;
    evaluated_at: string;
  },
): OperationalReentryCleanControlProviderCompatibilityProbePricingV02 {
  assertExactRouteV02(input.route);
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 400 },
    output_rate: { unit: "token", cost_per_unit: 1_600 },
    pricing_source_version:
      "openai_gpt-4.1-mini-2025-04-14_2026-08-19",
    pricing_effective_at: ACGC_E2R2P1_PRICING_EFFECTIVE_AT_V02,
    pricing_expires_at: ACGC_E2R2P1_PRICING_EXPIRES_AT_V02,
    project_model_policy_fingerprint: input.route.integrity_fingerprint,
  });
  const budget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens,
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.timeoutMs,
    maximum_permitted_cost:
      ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
    evaluated_at: input.evaluated_at,
  });
  assertModelGatewayCostBudgetCurrentV01(budget, input.evaluated_at);
  const aggregateWorstCase = budget.calculated_worst_case_cost * 4;
  if (
    !Number.isSafeInteger(aggregateWorstCase) ||
    aggregateWorstCase !==
      ACGC_E2R2P1_AGGREGATE_WORST_CASE_COST_NANO_USD_V02 ||
    aggregateWorstCase >
      ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02
  ) {
    failV02("clean_control_probe_aggregate_cost_ceiling_exceeded");
  }
  return sealV02("clean_control_probe_pricing_without_integrity_fingerprint", {
    pricing_version:
      OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V02,
    provider_ref: structuredClone(input.route.provider_ref),
    model_ref: structuredClone(input.route.model_ref),
    route_fingerprint: input.route.integrity_fingerprint,
    pricing_source: "official_openai_model_page" as const,
    pricing_source_url:
      "https://developers.openai.com/api/docs/models/gpt-4.1-mini" as const,
    pricing_source_version: authority.pricing_source_version,
    pricing_effective_at: ACGC_E2R2P1_PRICING_EFFECTIVE_AT_V02,
    pricing_expires_at: ACGC_E2R2P1_PRICING_EXPIRES_AT_V02,
    evaluated_at: input.evaluated_at,
    input_nano_usd_per_token: 400 as const,
    cached_input_nano_usd_per_token: 100 as const,
    output_nano_usd_per_token: 1_600 as const,
    gateway_cost_budget: budget,
    per_shape_worst_case_cost_nano_usd: budget.calculated_worst_case_cost,
    aggregate_worst_case_cost_nano_usd: aggregateWorstCase,
    aggregate_ceiling_nano_usd:
      ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
    missing_usage_or_exact_cost: "unknown_never_zero" as const,
  });
}

export function buildOperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02(
  input: Omit<BuildOperationalReentryCleanControlProviderCompatibilityProbeInputV02, "authorization">,
): OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02 {
  const origin = authorizedOriginV02(input.repository_identity.origin);
  const representativeShapePlan =
    buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02();
  const providerContract =
    buildOperationalReentryCleanControlProviderCompatibilityProbeProviderContractV02(
      input.route,
    );
  const pricing =
    buildOperationalReentryCleanControlProviderCompatibilityProbePricingV02(
      input,
    );
  return {
    repository_slug: AUTHORIZED_REPOSITORY_SLUG_V02,
    authorized_origin: origin,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    expected_active_selection_revision:
      input.admission.expected_active_selection_revision,
    project_root_fingerprint: fingerprintV02(input.admission.project_root),
    case_fingerprint:
      operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
    common_task_evidence_fingerprint:
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    representative_shape_plan_fingerprint:
      representativeShapePlan.integrity.fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    provider_contract_fingerprint: providerContract.integrity.fingerprint,
    pricing_fingerprint: pricing.integrity.fingerprint,
    pricing_snapshot_evaluated_at: pricing.evaluated_at,
    pricing_authority_fingerprint:
      pricing.gateway_cost_budget.authority.pricing_fingerprint,
    pricing_authority_expires_at: pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      pricing.aggregate_worst_case_cost_nano_usd,
  };
}

export function validateOperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02(
  value: unknown,
  input: Omit<BuildOperationalReentryCleanControlProviderCompatibilityProbeInputV02, "authorization">,
): OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02 {
  if (!isRecordV02(value)) {
    failV02("clean_control_probe_authorization_missing_or_malformed");
  }
  exactKeysV02(value, [
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
    "provider_contract_version",
    "codec_version",
    "response_schema_version",
    "parser_version",
    "adapter_implementation_id",
    "adapter_implementation_version",
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
    "stop_after_first_non_success_terminal_result",
    "second_probe_authorized",
    "behavioral_cohort_authorized",
    "replication_authorized",
    "policy_authorized",
    "stage_7_authorized",
    "maximum_total_cost_nano_usd",
    "integrity",
  ]);
  const authorization = structuredClone(
    value,
  ) as unknown as OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02;
  assertSealedV02(authorization);
  const pricingSnapshotAt = timestampV02(
    authorization.pricing_snapshot_evaluated_at,
  );
  const expectations =
    buildOperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02(
      {
        ...input,
        evaluated_at: authorization.pricing_snapshot_evaluated_at,
      },
    );
  const currentPricing =
    buildOperationalReentryCleanControlProviderCompatibilityProbePricingV02(
      input,
    );
  const issuedAt = timestampV02(authorization.issued_at);
  const expiresAt = timestampV02(authorization.expires_at);
  const evaluatedAt = timestampV02(input.evaluated_at);
  const pricingExpiresAt = timestampV02(
    authorization.pricing_authority_expires_at,
  );
  if (
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V02 ||
    !SAFE_AUTHORIZATION_ID_V02.test(authorization.authorization_id) ||
    authorization.authorization_kind !==
      "one_bounded_clean_control_provider_compatibility_probe" ||
    authorization.request_family_kind !==
      "clean_control_compatibility_probe" ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= ACGC_E2R2P1_ISSUE_NUMBER_V02 ||
    !GIT_SHA_V02.test(authorization.exact_merged_source_head) ||
    authorization.exact_merged_source_head === ACGC_E2R2H_MERGE_SHA_V02 ||
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
    authorization.provider_contract_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02 ||
    authorization.codec_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03 ||
    authorization.response_schema_version !==
      "operational_reentry_matched_cohort_response_schema.v0.3" ||
    authorization.parser_version !==
      "operational_reentry_matched_cohort_parser.v0.2" ||
    authorization.adapter_implementation_id !==
      "openai_responses.operational_reentry_matched_cohort" ||
    authorization.adapter_implementation_version !==
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.4" ||
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
        ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
      ) ||
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
    authorization.behavioral_cohort_authorized !== false ||
    authorization.replication_authorized !== false ||
    authorization.policy_authorized !== false ||
    authorization.stage_7_authorized !== false ||
    authorization.maximum_total_cost_nano_usd !==
      ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02 ||
    expectations.aggregate_worst_case_cost_nano_usd >
      authorization.maximum_total_cost_nano_usd ||
    pricingSnapshotAt > issuedAt ||
    issuedAt >= expiresAt ||
    expiresAt - issuedAt > 2 * 60 * 60 * 1000 ||
    evaluatedAt < issuedAt ||
    evaluatedAt >= expiresAt ||
    expiresAt > pricingExpiresAt
  ) {
    failV02("clean_control_probe_authorization_mismatched");
  }
  return authorization;
}

export function buildOperationalReentryCleanControlProviderCompatibilityProbeV02(
  input: BuildOperationalReentryCleanControlProviderCompatibilityProbeInputV02,
): OperationalReentryCleanControlProviderCompatibilityProbePreparedV02 {
  const authorization =
    validateOperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02(
      input.authorization,
      input,
    );
  const caseValue = structuredClone(
    operationalReentryMatchedCohortCaseFixtureV02,
  );
  const representativeShapePlan =
    buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02(
      caseValue,
    );
  const providerContract =
    buildOperationalReentryCleanControlProviderCompatibilityProbeProviderContractV02(
      input.route,
    );
  const pricing =
    buildOperationalReentryCleanControlProviderCompatibilityProbePricingV02({
      admission: input.admission,
      route: input.route,
      evaluated_at: authorization.pricing_snapshot_evaluated_at,
    });
  const requestFamilyBasisFingerprint = fingerprintV02({
    authorization_fingerprint: authorization.integrity.fingerprint,
    representative_shape_plan_fingerprint:
      representativeShapePlan.integrity.fingerprint,
    request_family_kind: "clean_control_compatibility_probe",
  });
  const entries: OperationalReentryCleanControlProviderCompatibilityProbePlanEntryV02[] =
    representativeShapePlan.entries.map((entry) => {
      const traceFingerprint = fingerprintV02({
        request_family_basis_fingerprint: requestFamilyBasisFingerprint,
        canonical_order: entry.canonical_order,
        shape: entry.shape,
        call_slot_id: entry.call_slot_id,
      });
      const requestFamilyTraceId =
        createDeterministicModelProviderRequestTraceV01({
          request_family_kind: "clean_control_compatibility_probe",
          request_family_fingerprint: traceFingerprint,
        });
      return {
        ...structuredClone(entry),
        request_family_trace_id: requestFamilyTraceId,
        client_request_id: createDeterministicModelClientRequestIdV01({
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
          provider_request_trace_id: requestFamilyTraceId,
          call_slot_id: entry.call_slot_id,
          model: input.route.model_ref.external_id,
        }),
      };
    });
  const plan = sealV02("clean_control_probe_plan_without_integrity_fingerprint", {
    plan_version:
      OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V02,
    authorization_fingerprint: authorization.integrity.fingerprint,
    source_repository_head_sha: authorization.exact_merged_source_head,
    future_live_issue_number: authorization.future_live_issue_number,
    request_family_kind: "clean_control_compatibility_probe" as const,
    request_family_basis_fingerprint: requestFamilyBasisFingerprint,
    representative_shape_plan_fingerprint:
      representativeShapePlan.integrity.fingerprint,
    canonical_order: ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
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
    `operational-reentry-clean-control-provider-probe:${fingerprintV02({
      authorization_fingerprint: authorization.integrity.fingerprint,
      plan_fingerprint: plan.integrity.fingerprint,
    }).slice("sha256:".length, "sha256:".length + 32)}`;
  const manifest = sealV02(
    "clean_control_probe_manifest_without_integrity_fingerprint",
    {
      manifest_version:
        OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_MANIFEST_VERSION_V02,
      probe_version:
        OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_VERSION_V02,
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
      pricing_fingerprint: pricing.integrity.fingerprint,
      pricing_authority_fingerprint:
        pricing.gateway_cost_budget.authority.pricing_fingerprint,
      request_family_kind: "clean_control_compatibility_probe" as const,
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
  validatePreparedV02(prepared);
  return structuredClone(prepared);
}

export async function runOperationalReentryCleanControlProviderCompatibilityProbeV02(
  input: BuildOperationalReentryCleanControlProviderCompatibilityProbeInputV02,
  dependencies: RunOperationalReentryCleanControlProviderCompatibilityProbeDependenciesV02,
): Promise<OperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02> {
  if (
    !dependencies ||
    typeof dependencies.assert_source_unchanged !== "function" ||
    typeof dependencies.consume_authorization !== "function"
  ) {
    failV02("clean_control_probe_runtime_dependencies_missing");
  }
  const prepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02(input);
  const invokeGateway =
    dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV02;
  const cancellation =
    dependencies.cancellation_signal ?? new AbortController().signal;
  const shapes: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02[] =
    [];
  let authorizationConsumed = false;
  let terminalFailureObserved = false;

  for (const entry of prepared.plan.entries) {
    if (terminalFailureObserved) {
      const unattempted = terminalV02({
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
      const blocked = terminalV02({
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

    let terminal: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02;
    try {
      const result = await invokeGateway(
        buildOperationalReentryCleanControlProviderCompatibilityProbeModelInvocationEnvelopeV02(
          entry,
          prepared,
          input.admission,
          cancellation,
        ),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_v02_route:
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
        failV02("clean_control_probe_deterministic_or_unobserved_success_refused");
      }
      terminal = terminalV02({
        entry,
        prepared,
        category: "accepted_and_normalized",
        receipt: result.model_invocation_receipt,
        output: result.output,
        failure_code: null,
      });
    } catch (error) {
      terminal = terminalFromErrorV02(entry, prepared, error);
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
  const report = buildReportV02(
    prepared.manifest.probe_id,
    shapes,
    prepared.pricing,
    sourceUnchangedAtTerminal,
    authorizationConsumed,
  );
  return validateOperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02(
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

export function deriveOperationalReentryCleanControlProviderCompatibilityProbeOutcomeV02(
  categories: OperationalReentryCleanControlProviderCompatibilityProbeTerminalCategoryV02[],
  sourceUnchangedAtTerminal = true,
): OperationalReentryCleanControlProviderCompatibilityProbeOutcomeV02 {
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

export function projectOperationalReentryCleanControlProviderCompatibilityProbePlanForArtifactV02(
  plan: OperationalReentryCleanControlProviderCompatibilityProbePlanV02,
): Omit<OperationalReentryCleanControlProviderCompatibilityProbePlanV02, "entries"> & {
  entries: OperationalReentryCleanControlProviderCompatibilityProbePlanArtifactEntryV02[];
} {
  assertSealedV02(plan);
  return {
    ...structuredClone(plan),
    entries: plan.entries.map(({ model_input: _input, ...entry }) => ({
      ...structuredClone(entry),
      provider_visible_input_persisted: false as const,
      raw_request_body_persisted: false as const,
    })),
  };
}

export function validateOperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02(
  result: OperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02,
): OperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02 {
  validatePreparedV02(result);
  assertSealedV02(result.report);
  result.shapes.forEach(assertSealedV02);
  if (
    result.shapes.length !== 4 ||
    result.shapes.some(
      (shape, index) =>
        shape.canonical_order !== index ||
        shape.shape !== ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02[index] ||
        shape.call_slot_id !== result.plan.entries[index]?.call_slot_id,
    ) ||
    canonicalizeProtocolValueV01(
      buildReportV02(
        result.manifest.probe_id,
        result.shapes,
        result.pricing,
        result.report.source_head_and_tracked_worktree_unchanged_at_terminal,
        result.report.authorization_consumed,
      ),
    ) !== canonicalizeProtocolValueV01(result.report)
  ) {
    failV02("clean_control_probe_result_invalid");
  }
  let failureSeen = false;
  for (const shape of result.shapes) {
    if (
      failureSeen &&
      shape.terminal_category !== "not_attempted_after_terminal_failure"
    ) {
      failV02("clean_control_probe_stop_policy_invalid");
    }
    if (
      shape.terminal_category !== "accepted_and_normalized" &&
      shape.terminal_category !== "not_attempted_after_terminal_failure"
    ) {
      failureSeen = true;
    }
  }
  scanForbiddenMaterialV02({
    authorization: result.authorization,
    manifest: result.manifest,
    plan: projectOperationalReentryCleanControlProviderCompatibilityProbePlanForArtifactV02(
      result.plan,
    ),
    shapes: result.shapes,
    report: result.report,
  });
  return structuredClone(result);
}

function validatePreparedV02(
  value: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02,
): void {
  [
    value.authorization,
    value.manifest,
    value.case,
    value.provider_contract,
    value.representative_shape_plan,
    value.plan,
    value.pricing,
  ].forEach(assertSealedV02);
  assertExactRouteV02(value.manifest.route);
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
    value.manifest.pricing_fingerprint !== value.pricing.integrity.fingerprint ||
    value.authorization.pricing_fingerprint !==
      value.pricing.integrity.fingerprint ||
    value.authorization.pricing_authority_fingerprint !==
      value.pricing.gateway_cost_budget.authority.pricing_fingerprint ||
    value.authorization.pricing_snapshot_evaluated_at !==
      value.pricing.evaluated_at ||
    value.manifest.request_family_kind !==
      "clean_control_compatibility_probe" ||
    value.plan.request_family_kind !== "clean_control_compatibility_probe" ||
    value.plan.entries.length !== 4 ||
    commonEvidenceFingerprints.size !== 1 ||
    !commonEvidenceFingerprints.has(
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    ) ||
    nonTargetByShape.get("A") !== nonTargetByShape.get("B") ||
    nonTargetByShape.get("B") !== nonTargetByShape.get("C") ||
    !dInput ||
    dInput.continuation_context.length !== 0 ||
    fingerprintV02(dInput.common_task_evidence) !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02 ||
    new Set(value.plan.entries.map((entry) => entry.call_slot_id)).size !== 4 ||
    new Set(
      value.plan.entries.map((entry) => entry.request_family_trace_id),
    ).size !== 4 ||
    new Set(value.plan.entries.map((entry) => entry.client_request_id)).size !==
      4 ||
    value.plan.entries.some(
      (entry, index) =>
        entry.shape !== ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02[index] ||
        entry.canonical_order !== index ||
        entry.strict_schema_preflight !== "passed" ||
        entry.model_input.invocation_context.call_slot_id !==
          entry.call_slot_id ||
        entry.model_input.invocation_context.cohort_ref !==
          "acgc-e2r2p-clean-control-compatibility-v02",
    )
  ) {
    failV02("clean_control_probe_prepared_identity_invalid");
  }
}

export function buildOperationalReentryCleanControlProviderCompatibilityProbeModelInvocationEnvelopeV02(
  entry: OperationalReentryCleanControlProviderCompatibilityProbePlanEntryV02,
  prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id: entry.request_family_trace_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
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
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: prepared.pricing.gateway_cost_budget,
    },
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.timeoutMs,
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

function terminalFromErrorV02(
  entry: OperationalReentryCleanControlProviderCompatibilityProbePlanEntryV02,
  prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02,
  error: unknown,
): OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02 {
  try {
    const invocationError = isModelGatewayInvocationErrorV01(error)
      ? error
      : null;
    if (
      invocationError?.provider_rejection_observation &&
      invocationError.provider_rejection_observation.client_request_id !==
        entry.client_request_id
    ) {
      failV02("clean_control_probe_rejection_identity_mismatch");
    }
    return terminalV02({
      entry,
      prepared,
      category: terminalCategoryV02(error),
      receipt: invocationError?.receipt ?? null,
      output: null,
      failure_code:
        invocationError?.code ??
        (error instanceof
        OperationalReentryCleanControlProviderCompatibilityProbeErrorV02
          ? error.code
          : "clean_control_probe_internal_failure"),
      provider_rejection_observation:
        invocationError?.provider_rejection_observation ?? undefined,
    });
  } catch {
    return terminalV02({
      entry,
      prepared,
      category: "internal_failure",
      receipt: null,
      output: null,
      failure_code: "clean_control_probe_internal_failure",
    });
  }
}

function terminalCategoryV02(
  error: unknown,
): OperationalReentryCleanControlProviderCompatibilityProbeTerminalCategoryV02 {
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

function terminalV02(input: {
  entry: OperationalReentryCleanControlProviderCompatibilityProbePlanEntryV02;
  prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02;
  category: OperationalReentryCleanControlProviderCompatibilityProbeTerminalCategoryV02;
  receipt: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02["receipt"];
  output: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02["normalized_output"];
  failure_code: string | null;
  provider_rejection_observation?: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02["provider_rejection_observation"];
}): OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02 {
  const receipt = input.receipt
    ? validateModelInvocationReceiptV02(input.receipt)
    : null;
  const usage = receipt?.usage ?? null;
  const outputFingerprint = input.output
    ? fingerprintV02(input.output)
    : null;
  if (
    receipt &&
    (receipt.purpose !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 ||
      receipt.invocation_id !== input.entry.call_slot_id ||
      (input.output !== null &&
        receipt.normalized_output_fingerprint !== outputFingerprint))
  ) {
    failV02("clean_control_probe_receipt_binding_invalid");
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
  return sealV02("clean_control_probe_shape_terminal_without_integrity_fingerprint", {
    canonical_order: input.entry.canonical_order,
    shape: input.entry.shape,
    call_slot_id: input.entry.call_slot_id,
    terminal_category: input.category,
    egress_attempted: receipt?.egress_attempted ?? false,
    request_family_kind: "clean_control_compatibility_probe" as const,
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

function buildReportV02(
  probeId: string,
  shapes: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02[],
  pricing: OperationalReentryCleanControlProviderCompatibilityProbePricingV02,
  sourceUnchangedAtTerminal: boolean,
  authorizationConsumed: boolean,
): OperationalReentryCleanControlProviderCompatibilityProbeReportV02 {
  const categories = shapes.map((shape) => shape.terminal_category);
  const outcome =
    deriveOperationalReentryCleanControlProviderCompatibilityProbeOutcomeV02(
      categories,
      sourceUnchangedAtTerminal,
    );
  const counts = Object.fromEntries(
    ACGC_E2R2P1_TERMINAL_CATEGORIES_V02.map((category) => [
      category,
      categories.filter((value) => value === category).length,
    ]),
  ) as Record<
    OperationalReentryCleanControlProviderCompatibilityProbeTerminalCategoryV02,
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
  return sealV02("clean_control_probe_report_without_integrity_fingerprint", {
    report_version:
      OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V02,
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
        ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
      missing_usage_or_exact_cost: "unknown_never_zero" as const,
    },
    real_provider_calls_observed_by_harness: null,
    compatibility_scope_boundary: {
      accepted_all_shapes_means_provider_contract_only: true as const,
      normalized_outputs_reused_as_behavioral_evidence: false as const,
      v02_behavioral_evaluator_built_or_invoked: false as const,
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
      "accepted_all_shapes means only provider acceptance and local v0.2 normalization for the four representative shapes.",
      "Compatibility output is not behavioral input or evidence and creates no E1, pairwise, conditioning, reset, continuation benefit, or continuation harm conclusion.",
      "A successful probe is not cohort, replication, policy, Stage 7, publication, Ready, or merge authority.",
      "Missing provider usage or exact cost remains unknown and is never interpreted as zero.",
    ],
  });
}

function readProviderBoundaryV02() {
  const representative =
    buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02()
      .entries[0];
  if (!representative) failV02("clean_control_probe_shape_missing");
  return projectOperationalReentryMatchedCohortProviderRequestV02(
    representative.model_input,
  );
}

function assertExactRouteV02(
  route: OperationalReentryMatchedCohortRouteV02,
): void {
  const boundary = readProviderBoundaryV02();
  const { integrity_fingerprint: fingerprint, ...withoutFingerprint } = route;
  if (
    route.gateway_version !== MODEL_GATEWAY_VERSION_V01 ||
    route.purpose !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 ||
    route.provider_ref.external_id !== "openai" ||
    route.model_ref.external_id !== "gpt-4.1-mini-2025-04-14" ||
    route.model_ref.external_id !== boundary.model ||
    route.adapter_implementation_id !== boundary.adapter_implementation_id ||
    route.adapter_implementation_version !==
      boundary.adapter_implementation_version ||
    route.provider_contract_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02 ||
    route.prepared_without_provider_egress !== true ||
    fingerprint !== fingerprintV02(withoutFingerprint)
  ) {
    failV02("clean_control_probe_route_mismatch");
  }
}

function scanForbiddenMaterialV02(value: unknown): void {
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
      failV02("clean_control_probe_forbidden_material");
    }
  }
}

function authorizedOriginV02(
  value: string,
): OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02["authorized_origin"] {
  if (!AUTHORIZED_ORIGINS_V02.has(value)) {
    failV02("clean_control_probe_repository_origin_mismatch");
  }
  return value as OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02["authorized_origin"];
}

function assertSealedV02(value: {
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}): void {
  const { integrity, ...withoutIntegrity } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    !SHA256_V02.test(integrity.fingerprint) ||
    integrity.fingerprint !== fingerprintV02(withoutIntegrity)
  ) {
    failV02("clean_control_probe_fingerprint_invalid");
  }
}

function sealV02<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV02 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: fingerprintV02(value),
    },
  };
}

function fingerprintV02(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function timestampV02(value: unknown): number {
  if (typeof value !== "string") {
    failV02("clean_control_probe_timestamp_invalid");
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    failV02("clean_control_probe_timestamp_invalid");
  }
  return parsed;
}

function exactKeysV02(value: Record<string, unknown>, keys: string[]): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...keys].sort())
  ) {
    failV02("clean_control_probe_authorization_missing_or_malformed");
  }
}

function isRecordV02(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failV02(code: string): never {
  throw new OperationalReentryCleanControlProviderCompatibilityProbeErrorV02(
    code,
  );
}
