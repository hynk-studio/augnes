import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  operationalReentryMatchedCohortCaseFixtureV02,
  operationalReentryMatchedCohortRubricFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
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
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  ACGC_E2_V02_SEALED_ORDER,
  buildOperationalReentryMatchedCohortModelInputV02,
  evaluateOperationalReentryMatchedCohortBlockV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortModelInputV03 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02,
  type OperationalReentryMatchedCohortArmV02,
  type OperationalReentryMatchedCohortBlockV02,
  type OperationalReentryMatchedCohortIntegrityV02,
  type OperationalReentryMatchedCohortModelInputV02,
  type OperationalReentryMatchedCohortObservedArmV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import type {
  OperationalReentryMatchedCohortModelOutputV03,
  OperationalReentryMatchedCohortRouteV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_REPORT_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_EVALUATOR_BRIDGE_VERSION_V01,
  type OperationalReentryParserClosedCleanControlCohortAuthorizationCandidateInputV01,
  type OperationalReentryParserClosedCleanControlCohortAuthorizationV01,
  type OperationalReentryParserClosedCleanControlCohortCallTerminalV01,
  type OperationalReentryParserClosedCleanControlCohortExecutionResultV01,
  type OperationalReentryParserClosedCleanControlCohortHarnessV01,
  type OperationalReentryParserClosedCleanControlCohortManifestV01,
  type OperationalReentryParserClosedCleanControlCohortPlanEntryV01,
  type OperationalReentryParserClosedCleanControlCohortPlanV01,
  type OperationalReentryParserClosedCleanControlCohortPreparedV01,
  type OperationalReentryParserClosedCleanControlCohortPricingV01,
  type OperationalReentryParserClosedCleanControlCohortReportV01,
  type OperationalReentryParserClosedCleanControlCohortTerminalCategoryV01,
  type OperationalReentryParserClosedCleanControlEvaluatorBridgeV01,
  type OperationalReentryParserClosedCleanControlEvaluatorProjectionV01,
} from "@/types/vnext/operational-reentry-parser-closed-clean-control-cohort";

export const ACGC_E2R2P5H_ISSUE_NUMBER_V01 = 219 as const;
export const ACGC_E2R2P5H_CASE_FINGERPRINT_V01 =
  "sha256:d702283dae6d9cfe586a3b7fd91893aee2720a3f136a027c321c3ecfa9d7fa4b" as const;
export const ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 =
  "sha256:455cb74df26f63eccd15952a98433cba7f410a9e8b312afe5d35d4ceb235f38d" as const;
export const ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01 =
  "sha256:4d286f56405ff66236a19d1e0f4529510faa8c53a80e6bba4ecac9c4845930e0" as const;
export const ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01 =
  "sha256:682905683f083ee67002dc4cf2577ec3ae4302e90fc85e27f43019b8b7978bbb" as const;
export const ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 =
  "sha256:182e0be9c2b4a53baca61c01d9b83f67fbd6855d1e3b8c9cbd182abeff4831e9" as const;
export const ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01 =
  11_699_200 as const;
export const ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01 =
  187_187_200 as const;
export const ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01 =
  1_000_000_000 as const;
export const ACGC_E2R2P5H_SEALED_ORDER_V01 = ACGC_E2_V02_SEALED_ORDER;

const AUTHORIZED_REPOSITORY_SLUG_V01 =
  "hynk-studio/augnes" as const;
const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);
const COHORT_REF_V01 = "acgc-e2r2p5h-parser-closed-clean-control-v03";
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;
const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const SAFE_ID_V01 = /^[A-Za-z0-9:._-]{1,200}$/u;
const TERMINAL_CATEGORIES_V01 = [
  "completed_live",
  "provider_rejected",
  "provider_response_invalid",
  "transport_failed",
  "timed_out",
  "cancelled",
  "blocked_before_egress",
  "authority_or_source_route_drift",
  "internal_failure",
  "not_attempted_after_hard_stop",
] as const;

export class OperationalReentryParserClosedCleanControlCohortErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryParserClosedCleanControlCohortErrorV01";
  }
}

export class OperationalReentryParserClosedCleanControlCohortDriftErrorV01 extends Error {
  constructor(
    readonly drift_kind: "source" | "admission" | "authorization" | "route",
  ) {
    super(`parser_closed_clean_control_cohort_${drift_kind}_drift`);
    this.name = "OperationalReentryParserClosedCleanControlCohortDriftErrorV01";
  }
}

export interface BuildOperationalReentryParserClosedCleanControlCohortInputV01 {
  authorization: unknown;
  pricing: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV03;
  repository_identity: {
    repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V01;
    origin: string;
  };
  evaluated_at: string;
}

export interface RunOperationalReentryParserClosedCleanControlCohortDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV03;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV03;
  cancellation_signal?: AbortSignal;
  assert_execution_state: (
    entry: OperationalReentryParserClosedCleanControlCohortPlanEntryV01,
  ) => void | Promise<void>;
  consume_authorization: (input: {
    authorization: OperationalReentryParserClosedCleanControlCohortAuthorizationV01;
    cohort_id: string;
  }) => void;
  on_call_terminal?: (
    terminal: OperationalReentryParserClosedCleanControlCohortCallTerminalV01,
  ) => void | Promise<void>;
  on_block_evaluation?: (
    block: OperationalReentryParserClosedCleanControlCohortExecutionResultV01["block_evaluations"][number],
  ) => void | Promise<void>;
}

export const operationalReentryParserClosedCleanControlCohortHarnessV01 =
  Object.freeze<OperationalReentryParserClosedCleanControlCohortHarnessV01>({
    harness_version:
      OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
    issue_number: 219,
    implementation_kind: "zero_egress_future_live_harness",
    successor_live_authorizations_created: 0,
    successor_live_authorizations_consumed: 0,
    real_provider_calls: 0,
    behavioral_cohort_result: "none",
    compatibility_probe_result_reused_as_behavioral_input: false,
    behavioral_cohort_executed: false,
    replication_authorized: false,
    policy_authorized: false,
    stage_7_authorized: false,
  });

export function buildOperationalReentryParserClosedCleanControlCohortPlanV01(): OperationalReentryParserClosedCleanControlCohortPlanV01 {
  assertHistoricalProviderContractV01();
  const entries: OperationalReentryParserClosedCleanControlCohortPlanEntryV01[] =
    ACGC_E2R2P5H_SEALED_ORDER_V01.flatMap((order, block) =>
      order.map((arm, position) => {
        const callOrder = block * 4 + position;
        const callSlotId = `e2r2p5h-call-${String(callOrder).padStart(2, "0")}-${fingerprintV01({
          behavioral_family:
            OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
          case_fingerprint: ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
          repeat_block: block,
          position_in_block: position,
          arm,
        }).slice(7, 19)}`;
        const modelInput = buildOperationalReentryMatchedCohortModelInputV03({
          arm,
          block: block as OperationalReentryMatchedCohortBlockV02,
          call_slot_id: callSlotId,
        });
        modelInput.invocation_context.cohort_ref = COHORT_REF_V01;
        const request =
          projectOperationalReentryMatchedCohortProviderRequestV03(modelInput);
        if (
          request.adapter_request_route_fingerprint !==
          ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01
        ) {
          failV01("parser_closed_clean_control_provider_contract_changed");
        }
        const requestFamilyBasis = fingerprintV01({
          family: "parser_closed_clean_control_cohort",
          case_fingerprint: ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
          call_slot_id: callSlotId,
          repeat_block: block,
          position_in_block: position,
          arm,
        });
        const traceId = createDeterministicModelProviderRequestTraceV01({
          request_family_kind: "parser_closed_clean_control_cohort",
          request_family_fingerprint: requestFamilyBasis,
        });
        return {
          call_order: callOrder,
          call_slot_id: callSlotId,
          repeat_block: block as OperationalReentryMatchedCohortBlockV02,
          position_in_block: position as 0 | 1 | 2 | 3,
          arm,
          behavioral_family:
            OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
          case_fingerprint: ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
          common_task_evidence_fingerprint: fingerprintV01(
            modelInput.common_task_evidence,
          ),
          non_target_continuation_fingerprint: fingerprintV01(
            modelInput.continuation_context.filter(
              (item) => item.role === "non_target",
            ),
          ),
          treatment_material_fingerprint: fingerprintV01({
            continuation_context: modelInput.continuation_context,
            stale_relation: modelInput.stale_relation,
          }),
          model_input_fingerprint: fingerprintV01(modelInput),
          provider_visible_request_fingerprint: request.request_fingerprint,
          schema_fingerprint: request.schema_fingerprint,
          adapter_request_route_fingerprint:
            request.adapter_request_route_fingerprint,
          request_family_trace_id: traceId,
          client_request_id: createDeterministicModelClientRequestIdV01({
            purpose: "parser_closed_clean_control_cohort",
            provider_request_trace_id: traceId,
            call_slot_id: callSlotId,
            model: request.model,
          }),
          model_input: modelInput,
        };
      }),
    );
  const plan = sealV01(
    "parser_closed_clean_control_cohort_plan_without_integrity_fingerprint",
    {
      plan_version:
        OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_PLAN_VERSION_V01,
      behavioral_family:
        OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
      case_fingerprint: ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
      common_task_evidence_fingerprint:
        ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
      request_family_kind: "parser_closed_clean_control_cohort" as const,
      planned_calls: 16 as const,
      repeat_blocks: 4 as const,
      calls_per_block: 4 as const,
      calls_per_arm: 4 as const,
      sealed_order: ACGC_E2R2P5H_SEALED_ORDER_V01,
      maximum_parallel_provider_calls: 1 as const,
      retries: 0 as const,
      replacement_calls: 0 as const,
      adaptive_stopping: false as const,
      fresh_stateless_invocation_per_call: true as const,
      conversation_reuse: false as const,
      thread_reuse: false as const,
      previous_response_reuse: false as const,
      entries,
    },
  );
  validatePlanV01(plan);
  return plan;
}

export function buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01(): OperationalReentryParserClosedCleanControlEvaluatorBridgeV01 {
  return sealV01(
    "parser_closed_clean_control_evaluator_bridge_without_integrity_fingerprint",
    {
      bridge_version:
        OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_EVALUATOR_BRIDGE_VERSION_V01,
      historical_evaluator_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02,
      historical_e1_evaluator_version:
        "operational_reentry_perturbation_evaluation.v0.1" as const,
      parser_closed_wire_representation_is_evaluator_dimension: false as const,
      v03_semantics_equal_canonical_v02: true as const,
      compared_dimensions: [
        "task",
        "common_task_evidence",
        "continuation_context",
        "stale_relation",
        "authority_notice",
        "result_status_semantics",
        "required_check_semantics",
        "operation_action_semantics",
        "result_limitation_semantics",
      ] as const,
    },
  );
}

export function projectOperationalReentryParserClosedCleanControlEvaluatorInputV01(
  entry: OperationalReentryParserClosedCleanControlCohortPlanEntryV01,
  output: OperationalReentryMatchedCohortModelOutputV03,
): OperationalReentryParserClosedCleanControlEvaluatorProjectionV01 {
  const canonicalV02 = buildOperationalReentryMatchedCohortModelInputV02({
    arm: entry.arm,
    block: entry.repeat_block,
    call_slot_id: entry.call_slot_id,
  });
  assertEvaluatorSemanticEqualityV01(entry.model_input, canonicalV02);
  const observedArm: OperationalReentryMatchedCohortObservedArmV02 = {
    arm: entry.arm,
    call_slot_id: entry.call_slot_id,
    model_input: canonicalV02,
    normalized_output: structuredClone(output),
  };
  return {
    bridge: buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01(),
    canonical_v02_input: canonicalV02,
    observed_arm: observedArm,
  };
}

export function buildOperationalReentryParserClosedCleanControlCohortPricingV01(
  input: Omit<
    OperationalReentryParserClosedCleanControlCohortPricingV01,
    | "pricing_version"
    | "per_call_conservative_worst_case_nano_usd"
    | "aggregate_conservative_worst_case_nano_usd"
    | "maximum_total_cost_nano_usd"
    | "static_harness_is_live_pricing_authority"
    | "exact_cost_basis"
    | "missing_exact_usage_or_cost"
    | "integrity"
  >,
): OperationalReentryParserClosedCleanControlCohortPricingV01 {
  if (
    input.pricing_snapshot_authority !==
      "future_live_issue_must_refresh_official_pricing" ||
    !SAFE_ID_V01.test(input.pricing_source_version) ||
    !SHA256_V01.test(input.pricing_authority_fingerprint) ||
    input.pricing_authority_fingerprint !==
      input.gateway_cost_budget.authority.pricing_fingerprint ||
    !nonnegativeSafeIntegerV01(input.input_nano_usd_per_token) ||
    !nonnegativeSafeIntegerV01(input.cached_input_nano_usd_per_token) ||
    !nonnegativeSafeIntegerV01(input.output_nano_usd_per_token) ||
    input.gateway_cost_budget.calculated_worst_case_cost !==
      ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01 ||
    input.gateway_cost_budget.maximum_permitted_cost !==
      ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01 ||
    input.gateway_cost_budget.within_ceiling !== true ||
    timestampV01(input.pricing_snapshot_evaluated_at) >=
      timestampV01(input.pricing_authority_expires_at)
  ) {
    failV01("parser_closed_clean_control_pricing_invalid");
  }
  return sealV01(
    "parser_closed_clean_control_pricing_without_integrity_fingerprint",
    {
      pricing_version:
        "operational_reentry_parser_closed_clean_control_matched_cohort_pricing.v0.1" as const,
      ...structuredClone(input),
      exact_cost_basis: "validated_provider_reported_token_usage" as const,
      missing_exact_usage_or_cost: "unknown_never_zero" as const,
      per_call_conservative_worst_case_nano_usd:
        ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01,
      aggregate_conservative_worst_case_nano_usd:
        ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01,
      maximum_total_cost_nano_usd:
        ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01,
      static_harness_is_live_pricing_authority: false as const,
    },
  );
}

export function buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01(
  input: OperationalReentryParserClosedCleanControlCohortAuthorizationCandidateInputV01,
): OperationalReentryParserClosedCleanControlCohortAuthorizationV01 {
  const authorization = sealV01(
    "parser_closed_clean_control_cohort_authorization_without_integrity_fingerprint",
    {
      authorization_version:
        OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01,
      authorization_kind:
        "one_bounded_parser_closed_clean_control_behavioral_cohort" as const,
      request_family_kind: "parser_closed_clean_control_cohort" as const,
      ...structuredClone(input),
    },
  );
  validateAuthorizationShapeV01(authorization);
  return authorization;
}

export function buildOperationalReentryParserClosedCleanControlCohortV01(
  input: BuildOperationalReentryParserClosedCleanControlCohortInputV01,
): OperationalReentryParserClosedCleanControlCohortPreparedV01 {
  assertExactRouteV01(input.route);
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  const evaluatorBridge =
    buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01();
  const providerContract =
    readOperationalReentryMatchedCohortProviderContractV03();
  const pricing = validatePricingV01(input.pricing);
  const authorization = validateAuthorizationV01(input.authorization, {
    input,
    plan,
    evaluatorBridge,
    pricing,
  });
  const cohortId = `operational-reentry-parser-closed-clean-control-cohort:${fingerprintV01({
    authorization_fingerprint: authorization.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
  }).slice(7, 39)}`;
  const manifest: OperationalReentryParserClosedCleanControlCohortManifestV01 =
    sealV01(
      "parser_closed_clean_control_cohort_manifest_without_integrity_fingerprint",
      {
        manifest_version:
          OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_MANIFEST_VERSION_V01,
        cohort_version:
          OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
        cohort_id: cohortId,
        future_live_issue_number: authorization.future_live_issue_number,
        source_repository_head_sha: authorization.exact_merged_source_head,
        authorization_fingerprint: authorization.integrity.fingerprint,
        case_fingerprint: plan.case_fingerprint,
        common_task_evidence_fingerprint:
          plan.common_task_evidence_fingerprint,
        plan_fingerprint: plan.integrity.fingerprint,
        evaluator_bridge_fingerprint: evaluatorBridge.integrity.fingerprint,
        route: structuredClone(input.route),
        provider_contract_fingerprint: providerContract.integrity.fingerprint,
        adapter_request_route_fingerprint:
          ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
        pricing_fingerprint: pricing.integrity.fingerprint,
        request_family_kind: "parser_closed_clean_control_cohort" as const,
        provider_egress:
          "allow_only_with_supplied_future_authorization" as const,
        data_classification: "public_safe" as const,
        retention_class: "none" as const,
        raw_prompt_persisted: false as const,
        raw_request_body_persisted: false as const,
        raw_provider_response_persisted: false as const,
        raw_provider_error_persisted: false as const,
        hidden_reasoning_persisted: false as const,
        credentials_or_full_headers_persisted: false as const,
      },
    );
  return {
    authorization,
    plan,
    evaluator_bridge: evaluatorBridge,
    provider_contract: providerContract,
    pricing,
    manifest,
  };
}

export async function runOperationalReentryParserClosedCleanControlCohortV01(
  input: BuildOperationalReentryParserClosedCleanControlCohortInputV01,
  dependencies: RunOperationalReentryParserClosedCleanControlCohortDependenciesV01,
): Promise<OperationalReentryParserClosedCleanControlCohortExecutionResultV01> {
  if (
    !dependencies ||
    typeof dependencies.assert_execution_state !== "function" ||
    typeof dependencies.consume_authorization !== "function"
  ) {
    failV01("parser_closed_clean_control_runtime_dependencies_missing");
  }
  const prepared =
    buildOperationalReentryParserClosedCleanControlCohortV01(input);
  const invokeGateway =
    dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV03;
  const cancellation =
    dependencies.cancellation_signal ?? new AbortController().signal;
  const calls: OperationalReentryParserClosedCleanControlCohortCallTerminalV01[] =
    [];
  const evaluatorInputs: OperationalReentryMatchedCohortObservedArmV02[] = [];
  let authorizationConsumed = false;
  let hardStopCode: string | null = null;

  for (const entry of prepared.plan.entries) {
    if (hardStopCode) {
      const terminal = terminalV01(
        entry,
        prepared,
        "not_attempted_after_hard_stop",
        null,
        null,
        hardStopCode,
        true,
      );
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      continue;
    }
    try {
      await dependencies.assert_execution_state(entry);
    } catch (error) {
      hardStopCode =
        error instanceof OperationalReentryParserClosedCleanControlCohortDriftErrorV01
          ? error.message
          : "parser_closed_clean_control_execution_state_invalid";
      const terminal = terminalV01(
        entry,
        prepared,
        "authority_or_source_route_drift",
        null,
        null,
        hardStopCode,
        true,
      );
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      continue;
    }
    let consumptionWriteFailed = false;
    let terminal: OperationalReentryParserClosedCleanControlCohortCallTerminalV01;
    try {
      const result = await invokeGateway(
        buildOperationalReentryParserClosedCleanControlCohortModelInvocationEnvelopeV01(
          entry,
          prepared,
          input.admission,
          cancellation,
        ),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_v03_route: input.route,
          on_provider_egress_attempt() {
            if (!authorizationConsumed) {
              try {
                dependencies.consume_authorization({
                  authorization: prepared.authorization,
                  cohort_id: prepared.manifest.cohort_id,
                });
                authorizationConsumed = true;
              } catch {
                consumptionWriteFailed = true;
                failV01(
                  "parser_closed_clean_control_authorization_consumption_persistence_failed",
                );
              }
            }
          },
        },
      );
      const projection =
        projectOperationalReentryParserClosedCleanControlEvaluatorInputV01(
          entry,
          result.output,
        );
      evaluatorInputs.push(projection.observed_arm);
      terminal = terminalV01(
        entry,
        prepared,
        "completed_live",
        result.model_invocation_receipt,
        result.output,
        null,
        false,
      );
    } catch (error) {
      const classified = classifyFailureV01(error, consumptionWriteFailed);
      if (classified.hard_stop) hardStopCode = classified.failure_code;
      const invocationError = isModelGatewayInvocationErrorV01(error)
        ? error
        : null;
      terminal = terminalV01(
        entry,
        prepared,
        classified.category,
        invocationError?.receipt ?? null,
        null,
        classified.failure_code,
        classified.hard_stop,
        invocationError?.provider_rejection_observation ?? null,
        invocationError?.provider_response_invalid_observation ?? null,
      );
    }
    calls.push(terminal);
    await dependencies.on_call_terminal?.(terminal);
  }

  let terminalExecutionStateValid = true;
  try {
    await dependencies.assert_execution_state(prepared.plan.entries[15]!);
  } catch {
    terminalExecutionStateValid = false;
  }

  const blocks = ([0, 1, 2, 3] as const).map((block) =>
    evaluateOperationalReentryMatchedCohortBlockV02(
      block,
      evaluatorInputs.filter((entry) => {
        const planEntry = prepared.plan.entries.find(
          (candidate) => candidate.call_slot_id === entry.call_slot_id,
        );
        return planEntry?.repeat_block === block;
      }),
      operationalReentryMatchedCohortRubricFixtureV02,
    ),
  );
  for (const block of blocks) await dependencies.on_block_evaluation?.(block);
  const report = buildReportV01(
    prepared,
    calls,
    blocks,
    authorizationConsumed,
    terminalExecutionStateValid,
  );
  return {
    ...prepared,
    calls,
    evaluator_inputs: evaluatorInputs,
    block_evaluations: blocks,
    report,
  };
}

export function buildOperationalReentryParserClosedCleanControlCohortModelInvocationEnvelopeV01(
  entry: OperationalReentryParserClosedCleanControlCohortPlanEntryV01,
  prepared: OperationalReentryParserClosedCleanControlCohortPreparedV01,
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
      prepared.plan.case_fingerprint,
      prepared.plan.integrity.fingerprint,
      prepared.evaluator_bridge.integrity.fingerprint,
      entry.model_input_fingerprint,
      entry.schema_fingerprint,
    ],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
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

export function projectOperationalReentryParserClosedCleanControlCohortPlanForArtifactV01(
  plan: OperationalReentryParserClosedCleanControlCohortPlanV01,
) {
  return {
    ...structuredClone(plan),
    entries: plan.entries.map(({ model_input: _modelInput, ...entry }) => ({
      ...structuredClone(entry),
      provider_visible_input_persisted: false as const,
      raw_request_body_persisted: false as const,
    })),
  };
}

function assertEvaluatorSemanticEqualityV01(
  inputV03: OperationalReentryParserClosedCleanControlCohortPlanEntryV01["model_input"],
  inputV02: OperationalReentryMatchedCohortModelInputV02,
): void {
  const dimensions: Array<[string, unknown, unknown]> = [
    ["task", inputV03.task, inputV02.task],
    ["common_evidence", inputV03.common_task_evidence, inputV02.common_task_evidence],
    ["continuation", inputV03.continuation_context, inputV02.continuation_context],
    ["stale_relation", inputV03.stale_relation, inputV02.stale_relation],
    ["authority", inputV03.authority_notice, inputV02.authority_notice],
    ["result_status", inputV03.allowed_output.result_statuses, inputV02.allowed_output.result_statuses],
    ["required_check", inputV03.allowed_output.required_check_dispositions, inputV02.allowed_output.required_check_dispositions],
    ["operation_action", inputV03.allowed_output.operation_action_class_tokens, inputV02.allowed_output.operation_action_class_tokens],
    ["result_limitation", inputV03.allowed_output.result_limitation_tokens, inputV02.allowed_output.result_limitation_tokens],
    [
      "continuation_selection",
      [...inputV03.allowed_output.referenced_continuation_tokens].sort(),
      inputV02.continuation_context.map((item) => item.context_token).sort(),
    ],
  ];
  const mismatch = dimensions.find(
    ([, left, right]) =>
      canonicalizeProtocolValueV01(left) !== canonicalizeProtocolValueV01(right),
  );
  if (mismatch) {
    failV01(`parser_closed_clean_control_evaluator_bridge_${mismatch[0]}_mismatch`);
  }
}

function validatePlanV01(
  plan: OperationalReentryParserClosedCleanControlCohortPlanV01,
): void {
  if (
    plan.entries.length !== 16 ||
    new Set(plan.entries.map((entry) => entry.call_slot_id)).size !== 16 ||
    new Set(plan.entries.map((entry) => entry.request_family_trace_id)).size !== 16 ||
    new Set(plan.entries.map((entry) => entry.client_request_id)).size !== 16 ||
    plan.entries.some(
      (entry, index) =>
        entry.call_order !== index ||
        entry.repeat_block !== Math.floor(index / 4) ||
        entry.position_in_block !== index % 4 ||
        entry.arm !== ACGC_E2R2P5H_SEALED_ORDER_V01[entry.repeat_block][entry.position_in_block] ||
        entry.case_fingerprint !== ACGC_E2R2P5H_CASE_FINGERPRINT_V01 ||
        entry.common_task_evidence_fingerprint !==
          ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 ||
        entry.adapter_request_route_fingerprint !==
          ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
    )
  ) {
    failV01("parser_closed_clean_control_plan_invalid");
  }
  for (const block of [0, 1, 2, 3] as const) {
    const entries = plan.entries.filter((entry) => entry.repeat_block === block);
    const [a, b, c, d] = (["A", "B", "C", "D"] as const).map(
      (arm) => entries.find((entry) => entry.arm === arm)!,
    );
    if (
      canonicalizeProtocolValueV01(a.model_input.common_task_evidence) !==
        canonicalizeProtocolValueV01(d.model_input.common_task_evidence) ||
      a.non_target_continuation_fingerprint !== b.non_target_continuation_fingerprint ||
      b.non_target_continuation_fingerprint !== c.non_target_continuation_fingerprint ||
      d.model_input.continuation_context.length !== 0 ||
      a.model_input.continuation_context.filter((item) => item.role === "target").length !== 1 ||
      b.model_input.continuation_context.filter((item) => item.role === "target").length !== 0 ||
      c.model_input.stale_relation?.applies_before_outcome !== true
    ) {
      failV01("parser_closed_clean_control_arm_semantics_invalid");
    }
    entries.forEach((entry) =>
      assertEvaluatorSemanticEqualityV01(
        entry.model_input,
        buildOperationalReentryMatchedCohortModelInputV02({
          arm: entry.arm,
          block: entry.repeat_block,
          call_slot_id: entry.call_slot_id,
        }),
      ),
    );
  }
}

function assertHistoricalProviderContractV01(): void {
  const contract = readOperationalReentryMatchedCohortProviderContractV03();
  if (
    operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint !==
      ACGC_E2R2P5H_CASE_FINGERPRINT_V01 ||
    OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02 !==
      ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 ||
    contract.integrity.fingerprint !==
      ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    contract.provider_contract_version !==
      "operational_reentry_clean_control_matched_cohort_provider_contract.v0.3" ||
    contract.input_codec_version !==
      "operational_reentry_matched_cohort_codec.v0.4" ||
    contract.response_schema_version !==
      "operational_reentry_matched_cohort_response_schema.v0.4" ||
    contract.parser_version !== "operational_reentry_matched_cohort_parser.v0.3" ||
    contract.openai_adapter_implementation_version !==
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.5"
  ) {
    failV01("parser_closed_clean_control_provider_contract_changed");
  }
}

function assertExactRouteV01(route: OperationalReentryMatchedCohortRouteV03): void {
  assertHistoricalProviderContractV01();
  const { integrity_fingerprint: _fingerprint, ...withoutFingerprint } = route;
  if (
    route.integrity_fingerprint !== ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01 ||
    route.integrity_fingerprint !== fingerprintV01(withoutFingerprint) ||
    route.provider_ref.external_id !== "openai" ||
    route.model_ref.external_id !== "gpt-4.1-mini-2025-04-14" ||
    route.provider_contract_fingerprint !==
      ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    route.adapter_implementation_version !==
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.5" ||
    route.response_bytes !== 1168 ||
    route.max_output_tokens !== 1168 ||
    route.prepared_without_provider_egress !== true
  ) {
    failV01("parser_closed_clean_control_route_changed");
  }
}

function validatePricingV01(
  value: unknown,
): OperationalReentryParserClosedCleanControlCohortPricingV01 {
  if (!isRecordV01(value) || !isRecordV01(value.integrity)) {
    failV01("parser_closed_clean_control_pricing_invalid");
  }
  const { integrity, ...payload } = value;
  if (
    integrity.fingerprint !== fingerprintV01(payload) ||
    value.per_call_conservative_worst_case_nano_usd !==
      ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01 ||
    value.aggregate_conservative_worst_case_nano_usd !==
      ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01 ||
    value.maximum_total_cost_nano_usd !==
      ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01 ||
    !nonnegativeSafeIntegerV01(value.input_nano_usd_per_token) ||
    !nonnegativeSafeIntegerV01(value.cached_input_nano_usd_per_token) ||
    !nonnegativeSafeIntegerV01(value.output_nano_usd_per_token) ||
    value.exact_cost_basis !== "validated_provider_reported_token_usage" ||
    value.missing_exact_usage_or_cost !== "unknown_never_zero" ||
    value.static_harness_is_live_pricing_authority !== false
  ) {
    failV01("parser_closed_clean_control_pricing_invalid");
  }
  return structuredClone(
    value as unknown as OperationalReentryParserClosedCleanControlCohortPricingV01,
  );
}

function validateAuthorizationShapeV01(
  authorization: OperationalReentryParserClosedCleanControlCohortAuthorizationV01,
): void {
  if (
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01 ||
    !SAFE_ID_V01.test(authorization.authorization_id) ||
    authorization.authorization_kind !==
      "one_bounded_parser_closed_clean_control_behavioral_cohort" ||
    authorization.request_family_kind !== "parser_closed_clean_control_cohort" ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= ACGC_E2R2P5H_ISSUE_NUMBER_V01 ||
    !GIT_SHA_V01.test(authorization.exact_merged_source_head) ||
    authorization.repository_slug !== AUTHORIZED_REPOSITORY_SLUG_V01 ||
    !AUTHORIZED_ORIGINS_V01.has(authorization.authorized_origin) ||
    !SHA256_V01.test(authorization.project_root_fingerprint) ||
    authorization.planned_calls !== 16 ||
    authorization.maximum_parallel_provider_calls !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacement_calls !== 0 ||
    authorization.adaptive_stopping !== false ||
    authorization.fresh_stateless_invocation_per_call !== true ||
    authorization.conversation_reuse !== false ||
    authorization.thread_reuse !== false ||
    authorization.previous_response_reuse !== false ||
    authorization.behavioral_cohort_authorized !== true ||
    authorization.replication_authorized !== false ||
    authorization.policy_authorized !== false ||
    authorization.stage_7_authorized !== false ||
    authorization.maximum_total_cost_nano_usd !==
      ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01 ||
    timestampV01(authorization.issued_at) >= timestampV01(authorization.expires_at)
  ) {
    failV01("parser_closed_clean_control_authorization_invalid");
  }
}

function validateAuthorizationV01(
  value: unknown,
  context: {
    input: BuildOperationalReentryParserClosedCleanControlCohortInputV01;
    plan: OperationalReentryParserClosedCleanControlCohortPlanV01;
    evaluatorBridge: OperationalReentryParserClosedCleanControlEvaluatorBridgeV01;
    pricing: OperationalReentryParserClosedCleanControlCohortPricingV01;
  },
): OperationalReentryParserClosedCleanControlCohortAuthorizationV01 {
  if (!isRecordV01(value) || !isRecordV01(value.integrity)) {
    failV01("parser_closed_clean_control_authorization_invalid");
  }
  const authorization = value as unknown as OperationalReentryParserClosedCleanControlCohortAuthorizationV01;
  validateAuthorizationShapeV01(authorization);
  const { integrity, ...payload } = authorization;
  const evaluatedAt = timestampV01(context.input.evaluated_at);
  if (
    integrity.fingerprint !== fingerprintV01(payload) ||
    authorization.repository_slug !== context.input.repository_identity.repository_slug ||
    authorization.authorized_origin !== context.input.repository_identity.origin ||
    authorization.workspace_id !== context.input.admission.workspace_id ||
    authorization.project_id !== context.input.admission.project_id ||
    authorization.expected_active_selection_revision !==
      context.input.admission.expected_active_selection_revision ||
    authorization.project_root_fingerprint !==
      fingerprintV01(context.input.admission.project_root) ||
    authorization.gateway_authorization_project_is_lab_experiment_meaning !== false ||
    authorization.case_fingerprint !== context.plan.case_fingerprint ||
    authorization.common_task_evidence_fingerprint !==
      context.plan.common_task_evidence_fingerprint ||
    authorization.behavioral_plan_fingerprint !== context.plan.integrity.fingerprint ||
    authorization.route_fingerprint !== context.input.route.integrity_fingerprint ||
    authorization.provider_contract_fingerprint !==
      ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    authorization.adapter_request_route_fingerprint !==
      ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
    authorization.evaluator_bridge_fingerprint !==
      context.evaluatorBridge.integrity.fingerprint ||
    authorization.evaluator_bridge_version !==
      OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_EVALUATOR_BRIDGE_VERSION_V01 ||
    authorization.evaluator_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02 ||
    authorization.e1_evaluator_version !==
      "operational_reentry_perturbation_evaluation.v0.1" ||
    authorization.provider_contract_version !==
      "operational_reentry_clean_control_matched_cohort_provider_contract.v0.3" ||
    authorization.codec_version !== "operational_reentry_matched_cohort_codec.v0.4" ||
    authorization.response_schema_version !==
      "operational_reentry_matched_cohort_response_schema.v0.4" ||
    authorization.parser_version !== "operational_reentry_matched_cohort_parser.v0.3" ||
    authorization.adapter_implementation_version !==
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.5" ||
    authorization.pricing_snapshot_evaluated_at !==
      context.pricing.pricing_snapshot_evaluated_at ||
    authorization.pricing_source_version !== context.pricing.pricing_source_version ||
    authorization.pricing_authority_fingerprint !==
      context.pricing.pricing_authority_fingerprint ||
    authorization.pricing_authority_expires_at !==
      context.pricing.pricing_authority_expires_at ||
    authorization.pricing_fingerprint !== context.pricing.integrity.fingerprint ||
    evaluatedAt < timestampV01(authorization.issued_at) ||
    evaluatedAt >= timestampV01(authorization.expires_at) ||
    timestampV01(authorization.expires_at) >
      timestampV01(authorization.pricing_authority_expires_at)
  ) {
    failV01("parser_closed_clean_control_authorization_mismatched");
  }
  return structuredClone(authorization);
}

function classifyFailureV01(
  error: unknown,
  consumptionWriteFailed: boolean,
): {
  category: OperationalReentryParserClosedCleanControlCohortTerminalCategoryV01;
  hard_stop: boolean;
  failure_code: string;
} {
  if (consumptionWriteFailed) {
    return {
      category: "internal_failure",
      hard_stop: true,
      failure_code:
        "parser_closed_clean_control_authorization_consumption_persistence_failed",
    };
  }
  if (!isModelGatewayInvocationErrorV01(error)) {
    return {
      category: "internal_failure",
      hard_stop: true,
      failure_code: "parser_closed_clean_control_internal_failure",
    };
  }
  const ordinary = error.receipt?.egress_attempted === true;
  const mapping = {
    model_gateway_provider_rejected: "provider_rejected",
    model_gateway_provider_response_invalid: "provider_response_invalid",
    model_gateway_transport_failed: "transport_failed",
    model_gateway_timeout: "timed_out",
    model_gateway_cancelled: "cancelled",
  } as const;
  const category = mapping[error.code as keyof typeof mapping];
  if (category) {
    return {
      category,
      hard_stop: category === "cancelled" || !ordinary,
      failure_code: error.code,
    };
  }
  return {
    category: "blocked_before_egress",
    hard_stop: true,
    failure_code: error.code,
  };
}

function terminalV01(
  entry: OperationalReentryParserClosedCleanControlCohortPlanEntryV01,
  prepared: OperationalReentryParserClosedCleanControlCohortPreparedV01,
  category: OperationalReentryParserClosedCleanControlCohortTerminalCategoryV01,
  receipt: OperationalReentryParserClosedCleanControlCohortCallTerminalV01["receipt"],
  output: OperationalReentryMatchedCohortModelOutputV03 | null,
  failureCode: string | null,
  hardStop: boolean,
  providerRejection: OperationalReentryParserClosedCleanControlCohortCallTerminalV01["provider_rejection_observation"] = null,
  providerInvalid: OperationalReentryParserClosedCleanControlCohortCallTerminalV01["provider_response_invalid_observation"] = null,
): OperationalReentryParserClosedCleanControlCohortCallTerminalV01 {
  const usage = receipt?.usage ?? null;
  const inputBytes = receipt?.budget.input_bytes_used ?? null;
  const exactCost =
    usage?.cached_input_tokens !== undefined
      ? (usage.input_tokens - usage.cached_input_tokens) *
          prepared.pricing.input_nano_usd_per_token +
        usage.cached_input_tokens *
          prepared.pricing.cached_input_nano_usd_per_token +
        usage.output_tokens * prepared.pricing.output_nano_usd_per_token
      : "unknown";
  return sealV01(
    "parser_closed_clean_control_call_terminal_without_integrity_fingerprint",
    {
      call_order: entry.call_order,
      call_slot_id: entry.call_slot_id,
      repeat_block: entry.repeat_block,
      position_in_block: entry.position_in_block,
      arm: entry.arm,
      terminal_category: category,
      hard_stop: hardStop,
      egress_attempted: receipt?.egress_attempted ?? false,
      request_family_kind: "parser_closed_clean_control_cohort" as const,
      request_family_trace_id: entry.request_family_trace_id,
      client_request_id: entry.client_request_id,
      model_input_fingerprint: entry.model_input_fingerprint,
      route_fingerprint: prepared.manifest.route.integrity_fingerprint,
      provider_contract_fingerprint:
        prepared.provider_contract.integrity.fingerprint,
      pricing_fingerprint: prepared.pricing.integrity.fingerprint,
      input_bytes: inputBytes,
      usage,
      latency_ms: receipt?.latency_ms ?? null,
      normalized_output: output ? structuredClone(output) : null,
      normalized_output_fingerprint: output ? fingerprintV01(output) : null,
      receipt,
      provider_rejection_observation: providerRejection,
      provider_response_invalid_observation: providerInvalid,
      terminal_failure_code: failureCode,
      exact_cost_nano_usd: exactCost,
    },
  );
}

function buildReportV01(
  prepared: OperationalReentryParserClosedCleanControlCohortPreparedV01,
  calls: OperationalReentryParserClosedCleanControlCohortCallTerminalV01[],
  blocks: OperationalReentryParserClosedCleanControlCohortExecutionResultV01["block_evaluations"],
  authorizationConsumed: boolean,
  terminalExecutionStateValid: boolean,
): OperationalReentryParserClosedCleanControlCohortReportV01 {
  const completeBlocks = blocks.filter((block) => block.status === "complete");
  const incompleteBlocks = blocks.filter((block) => block.status === "incomplete");
  const categoryCounts = Object.fromEntries(
    TERMINAL_CATEGORIES_V01.map((category) => [
      category,
      calls.filter((call) => call.terminal_category === category).length,
    ]),
  ) as OperationalReentryParserClosedCleanControlCohortReportV01["terminal_category_counts"];
  const relations = blocks.flatMap((block) => block.pairwise_comparisons);
  const relationCounts = countStringsV01(
    relations.map(
      (relation) =>
        `${relation.comparison_status}:${relation.behavioral_relation}:${relation.bounded_outcome_relation}`,
    ),
  );
  const attemptedCalls = calls.filter((call) => call.egress_attempted);
  const usages = attemptedCalls.flatMap((call) => (call.usage ? [call.usage] : []));
  const cachedUsages = usages.filter(
    (usage) => usage.cached_input_tokens !== undefined,
  );
  const latencies = attemptedCalls.flatMap((call) =>
    call.latency_ms === null ? [] : [call.latency_ms],
  );
  const exactCosts = attemptedCalls.flatMap((call) =>
    typeof call.exact_cost_nano_usd === "number"
      ? [call.exact_cost_nano_usd]
      : [],
  );
  const relationSignatures = blocks
    .filter((block) => block.status === "complete")
    .map((block) =>
      canonicalizeProtocolValueV01(
        block.pairwise_comparisons.map((relation) => ({
          pair: `${relation.left_arm}${relation.right_arm}`,
          status: relation.comparison_status,
          behavioral: relation.behavioral_relation,
          bounded: relation.bounded_outcome_relation,
        })),
      ),
    );
  return sealV01(
    "parser_closed_clean_control_cohort_report_without_integrity_fingerprint",
    {
      report_version:
        OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_REPORT_VERSION_V01,
      cohort_id: prepared.manifest.cohort_id,
      completion_status:
        completeBlocks.length === 4 &&
        terminalExecutionStateValid &&
        calls.every((call) => call.terminal_category === "completed_live")
          ? ("complete" as const)
          : ("incomplete" as const),
      planned_calls: 16 as const,
      terminal_call_records: 16 as const,
      attempted_provider_calls: calls.filter((call) => call.egress_attempted).length,
      terminal_execution_state_valid: terminalExecutionStateValid,
      complete_blocks: completeBlocks.map((block) => block.repeat_block),
      incomplete_blocks: incompleteBlocks.map((block) => block.repeat_block),
      terminal_category_counts: categoryCounts,
      common_compliance_valid_blocks: completeBlocks.filter((block) =>
        block.arm_evaluations.every(
          (evaluation) => evaluation.common_compliance === "valid",
        ),
      ).length,
      compliance_asymmetry_count: relations.filter(
        (relation) => relation.comparison_status === "compliance_asymmetry",
      ).length,
      conditioning_relations: blocks.map((block) => ({
        block: block.repeat_block,
        relation: block.conditioning_relation,
      })),
      reset_relations: blocks.map((block) => ({
        block: block.repeat_block,
        relation: block.reset_relation,
      })),
      bounded_pairwise_relation_counts: relationCounts,
      relation_repeatability:
        relationSignatures.length !== 4
          ? ("unknown" as const)
          : new Set(relationSignatures).size === 1
            ? ("repeatable" as const)
            : ("mixed" as const),
      usage: {
        known_call_count: usages.length,
        cached_input_known_call_count: cachedUsages.length,
        total_input_tokens:
          usages.length === attemptedCalls.length
            ? usages.reduce((sum, usage) => sum + usage.input_tokens, 0)
            : ("unknown" as const),
        total_cached_input_tokens:
          cachedUsages.length === attemptedCalls.length
            ? cachedUsages.reduce(
                (sum, usage) => sum + usage.cached_input_tokens!,
                0,
              )
            : ("unknown" as const),
        total_uncached_input_tokens:
          cachedUsages.length === attemptedCalls.length
            ? cachedUsages.reduce(
                (sum, usage) =>
                  sum + usage.input_tokens - usage.cached_input_tokens!,
                0,
              )
            : ("unknown" as const),
        total_output_tokens:
          usages.length === attemptedCalls.length
            ? usages.reduce((sum, usage) => sum + usage.output_tokens, 0)
            : ("unknown" as const),
      },
      latency: {
        known_call_count: latencies.length,
        total_ms:
          latencies.length === attemptedCalls.length
            ? latencies.reduce((sum, value) => sum + value, 0)
            : ("unknown" as const),
      },
      exact_cost_nano_usd:
        exactCosts.length === attemptedCalls.length
          ? exactCosts.reduce((sum, value) => sum + value, 0)
          : ("unknown" as const),
      conservative_cost: {
        per_call_worst_case_nano_usd:
          prepared.pricing.per_call_conservative_worst_case_nano_usd,
        planned_aggregate_worst_case_nano_usd:
          prepared.pricing.aggregate_conservative_worst_case_nano_usd,
        authorization_ceiling_nano_usd:
          prepared.pricing.maximum_total_cost_nano_usd,
      },
      limitations: [
        "synthetic_behavioral_result_is_not_core_evidence",
        "no_product_history_attribution",
        "no_policy_or_promotion_authority",
      ] as const,
      historical_stage_5: {
        actual_use: "unknown" as const,
        support_validation: "unknown" as const,
        outcome_association: "unknown" as const,
        causal_contribution: "unknown" as const,
        exact_case: "inconclusive" as const,
      },
      scalar_score_created: false as const,
      rank_created: false as const,
      winner_created: false as const,
      product_database_writes: 0 as const,
      core_writes: 0 as const,
      proposal_writes: 0 as const,
      review_decision_writes: 0 as const,
      transition_writes: 0 as const,
      policy_writes: 0 as const,
      authorization_consumed: authorizationConsumed,
    },
  );
}

function countStringsV01(values: string[]): Record<string, number> {
  return Object.fromEntries(
    [...new Set(values)].sort().map((value) => [
      value,
      values.filter((candidate) => candidate === value).length,
    ]),
  );
}

function nonnegativeSafeIntegerV01(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function sealV01<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV02 } {
  const payload = structuredClone(value);
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: fingerprintV01(payload),
    },
  };
}

function timestampV01(value: unknown): number {
  if (typeof value !== "string") failV01("parser_closed_clean_control_timestamp_invalid");
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    failV01("parser_closed_clean_control_timestamp_invalid");
  }
  return parsed;
}

function isRecordV01(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failV01(code: string): never {
  throw new OperationalReentryParserClosedCleanControlCohortErrorV01(code);
}
