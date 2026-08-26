import { buildOperationalReentryPerturbationFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import {
  ACGC_E2_NON_TARGET_CONTEXT_TOKENS_V01,
  ACGC_E2_TARGET_CONTEXT_TOKEN_V01,
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  buildOperationalReentryArmV01,
  buildOperationalReentryEvaluationV01,
  validateOperationalReentryEvaluationV01,
  type BuildOperationalReentryArmInputV01,
} from "@/lib/vnext/operational-reentry-perturbation";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
  assertModelGatewayCostBudgetCurrentV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  ModelGatewayInvocationErrorV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryMatchedCohortModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import { createDeterministicModelProviderRequestTraceV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V01,
  type OperationalReentryMatchedCohortArmEvaluationV01,
  type OperationalReentryMatchedCohortArmV01,
  type OperationalReentryMatchedCohortAuthorizationV01,
  type OperationalReentryMatchedCohortBlockEvaluationV01,
  type OperationalReentryMatchedCohortBlockV01,
  type OperationalReentryMatchedCohortCallPlanV01,
  type OperationalReentryMatchedCohortCallTerminalV01,
  type OperationalReentryMatchedCohortCaseV01,
  type OperationalReentryMatchedCohortDimensionResultV01,
  type OperationalReentryMatchedCohortExecutionResultV01,
  type OperationalReentryMatchedCohortIntegrityV01,
  type OperationalReentryMatchedCohortManifestV01,
  type OperationalReentryMatchedCohortModelInputV01,
  type OperationalReentryMatchedCohortModelOutputV01,
  type OperationalReentryMatchedCohortPairwiseRelationV01,
  type OperationalReentryMatchedCohortPricingV01,
  type OperationalReentryMatchedCohortReportV01,
  type OperationalReentryMatchedCohortReplacementLineageV02,
  type OperationalReentryMatchedCohortRouteV01,
  type OperationalReentryMatchedCohortRubricV01,
  type OperationalReentryMatchedCohortTerminalCategoryV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import type {
  OperationalReentryArmV01,
  OperationalReentryDownstreamVectorV01,
} from "@/types/vnext/operational-reentry-perturbation";

export const ACGC_E2_ISSUE_NUMBER_V01 = 185 as const;
export const ACGC_E2_PLANNED_CALLS_V01 = 16 as const;
export const ACGC_E2_COST_CEILING_NANO_USD_V01 = 5_000_000_000 as const;
export const ACGC_E2_PRICING_EFFECTIVE_AT_V01 =
  "2026-08-17T00:00:00.000Z" as const;
export const ACGC_E2_PRICING_EXPIRES_AT_V01 =
  "2026-08-24T00:00:00.000Z" as const;
export const ACGC_E2_SEALED_ORDER_V01 = Object.freeze([
  Object.freeze(["A", "B", "D", "C"] as const),
  Object.freeze(["B", "C", "A", "D"] as const),
  Object.freeze(["C", "D", "B", "A"] as const),
  Object.freeze(["D", "A", "C", "B"] as const),
] as const);
export const ACGC_E2_HISTORICAL_ISSUE_V02 = 185 as const;
export const ACGC_E2_HISTORICAL_PR_V02 = 186 as const;
export const ACGC_E2_HISTORICAL_HEAD_V02 =
  "123c5e31708a35c68be73b332d595bed9a9eea94" as const;

const GIT_SHA = /^[0-9a-f]{40}$/u;
const PAIRS = Object.freeze([
  ["A", "B"], ["C", "A"], ["A", "D"], ["B", "D"], ["C", "D"],
] as const);

export class OperationalReentryMatchedCohortErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryMatchedCohortErrorV01";
  }
}

export interface BuildOperationalReentryMatchedCohortInputV01 {
  source_head: string;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV01;
  evaluated_at: string;
  case?: OperationalReentryMatchedCohortCaseV01;
  rubric?: OperationalReentryMatchedCohortRubricV01;
}

export interface RunOperationalReentryMatchedCohortDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV01;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV01;
  cancellation_signal?: AbortSignal;
  assert_source_unchanged?: (entry: OperationalReentryMatchedCohortCallPlanV01["entries"][number]) => void | Promise<void>;
  on_attempt_prepared?: (input: {
    manifest: OperationalReentryMatchedCohortManifestV01;
    case: OperationalReentryMatchedCohortCaseV01;
    rubric: OperationalReentryMatchedCohortRubricV01;
    call_plan: OperationalReentryMatchedCohortCallPlanV01;
    pricing: OperationalReentryMatchedCohortPricingV01;
  }) => void | Promise<void>;
  on_first_egress_attempt?: () => void;
  on_call_terminal?: (call: OperationalReentryMatchedCohortCallTerminalV01) => void | Promise<void>;
  on_block_evaluation?: (block: OperationalReentryMatchedCohortBlockEvaluationV01) => void | Promise<void>;
}

export function buildOperationalReentryMatchedCohortCallPlanV01(
  caseInput: OperationalReentryMatchedCohortCaseV01 =
    operationalReentryMatchedCohortCaseFixtureV01,
): OperationalReentryMatchedCohortCallPlanV01 {
  assertCaseV01(caseInput);
  const entries: OperationalReentryMatchedCohortCallPlanV01["entries"] = [];
  let callOrder = 0;
  for (const [blockIndex, block] of ACGC_E2_SEALED_ORDER_V01.entries()) {
    for (const [position, arm] of block.entries()) {
      const callSlotId = `e2-call-${String(callOrder).padStart(2, "0")}-${createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          case_fingerprint: caseInput.integrity.fingerprint,
          block: blockIndex,
          position,
          arm,
        }),
      ).slice("sha256:".length, "sha256:".length + 12)}`;
      const modelInput = buildModelInputV01(
        caseInput,
        arm,
        blockIndex as OperationalReentryMatchedCohortBlockV01,
        callSlotId,
      );
      entries.push({
        call_order: callOrder,
        call_slot_id: callSlotId,
        repeat_block: blockIndex as OperationalReentryMatchedCohortBlockV01,
        position_in_block: position as 0 | 1 | 2 | 3,
        arm,
        model_input: modelInput,
        model_input_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(modelInput),
        ),
      });
      callOrder += 1;
    }
  }
  const withoutIntegrity = {
    call_plan_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V01,
    planned_calls: ACGC_E2_PLANNED_CALLS_V01,
    repeat_blocks: 4 as const,
    calls_per_block: 4 as const,
    sealed_order: ACGC_E2_SEALED_ORDER_V01,
    max_parallel_provider_calls: 1 as const,
    retries: 0 as const,
    replacement_calls: 0 as const,
    adaptive_stopping: false as const,
    stateless_invocations: true as const,
    conversation_reuse: false as const,
    thread_reuse: false as const,
    previous_response_reuse: false as const,
    entries,
  };
  return sealV01("call_plan_without_integrity_fingerprint", withoutIntegrity);
}

export function buildOperationalReentryMatchedCohortAuthorizationV01(
  sourceHead: string,
): OperationalReentryMatchedCohortAuthorizationV01 {
  if (!GIT_SHA.test(sourceHead)) failV01("operational_reentry_cohort_source_head_invalid");
  return sealV01("authorization_without_integrity_fingerprint", {
    authorization_version: OPERATIONAL_REENTRY_MATCHED_COHORT_AUTHORIZATION_VERSION_V01,
    authorization_kind: "one_issue_185_live_cohort" as const,
    issue_number: ACGC_E2_ISSUE_NUMBER_V01,
    source_head: sourceHead,
    planned_calls: ACGC_E2_PLANNED_CALLS_V01,
    max_total_cost_usd: "5.00" as const,
    aggregate_ceiling_nano_usd: ACGC_E2_COST_CEILING_NANO_USD_V01,
    retries: 0 as const,
    replacement_calls: 0 as const,
    further_cohort_authorized: false as const,
    source_correction_after_egress_authorized: false as const,
  });
}

/**
 * Describes the only lineage shape a separately authorized future replacement
 * could use. This record deliberately grants and consumes no authorization.
 */
export function buildOperationalReentryMatchedCohortReplacementLineageV02(): OperationalReentryMatchedCohortReplacementLineageV02 {
  return sealV01("replacement_lineage_without_integrity_fingerprint", {
    lineage_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V02,
    authorization_kind:
      "authorized_replacement_after_historical_incomplete" as const,
    historical_issue_number: ACGC_E2_HISTORICAL_ISSUE_V02,
    historical_pr_number: ACGC_E2_HISTORICAL_PR_V02,
    historical_source_head: ACGC_E2_HISTORICAL_HEAD_V02,
    retry_of_historical_cohort: false as const,
    historical_artifacts_rewritten: false as const,
    replacement_count: 1 as const,
    further_cohort_authorized: false as const,
    replacement_authorization_granted: false as const,
    replacement_authorization_consumed: false as const,
  });
}

export function buildOperationalReentryMatchedCohortPricingV01(input: {
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV01;
  evaluated_at: string;
}): OperationalReentryMatchedCohortPricingV01 {
  assertRouteV01(input.route);
  if (
    input.route.provider_ref.external_id !== "openai" ||
    input.route.model_ref.external_id !== "gpt-4.1-mini-2025-04-14"
  ) failV01("operational_reentry_cohort_pricing_route_unsupported");
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 400 },
    output_rate: { unit: "token", cost_per_unit: 1600 },
    pricing_source_version: "openai_gpt-4.1-mini-2025-04-14_2026-08-17",
    pricing_effective_at: ACGC_E2_PRICING_EFFECTIVE_AT_V01,
    pricing_expires_at: ACGC_E2_PRICING_EXPIRES_AT_V01,
    project_model_policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.route),
    ),
  });
  const budget = buildModelGatewayCostBudgetV01({
    authority,
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
    maximum_permitted_cost: ACGC_E2_COST_CEILING_NANO_USD_V01,
    evaluated_at: input.evaluated_at,
  });
  assertModelGatewayCostBudgetCurrentV01(budget, input.evaluated_at);
  const aggregateWorstCase = budget.calculated_worst_case_cost * 16;
  if (
    !Number.isSafeInteger(aggregateWorstCase) ||
    aggregateWorstCase > ACGC_E2_COST_CEILING_NANO_USD_V01
  ) failV01("operational_reentry_cohort_aggregate_cost_exceeded");
  return sealV01("pricing_without_integrity_fingerprint", {
    pricing_version: "operational_reentry_matched_cohort_pricing.v0.1" as const,
    provider_ref: structuredClone(input.route.provider_ref),
    model_ref: structuredClone(input.route.model_ref),
    currency: "USD" as const,
    accounting_unit: "nano_usd" as const,
    input_nano_usd_per_token: 400 as const,
    cached_input_nano_usd_per_token: 100 as const,
    output_nano_usd_per_token: 1600 as const,
    conservative_input_nano_usd_per_utf8_byte: 400 as const,
    pricing_source: "official_openai_model_page" as const,
    pricing_source_url:
      "https://developers.openai.com/api/docs/models/gpt-4.1-mini" as const,
    pricing_effective_at: ACGC_E2_PRICING_EFFECTIVE_AT_V01,
    pricing_expires_at: ACGC_E2_PRICING_EXPIRES_AT_V01,
    gateway_cost_budget: budget,
    aggregate_worst_case_cost_nano_usd: aggregateWorstCase,
    aggregate_ceiling_nano_usd: ACGC_E2_COST_CEILING_NANO_USD_V01,
  });
}

export function buildOperationalReentryMatchedCohortV01(
  input: BuildOperationalReentryMatchedCohortInputV01,
): {
  manifest: OperationalReentryMatchedCohortManifestV01;
  case: OperationalReentryMatchedCohortCaseV01;
  rubric: OperationalReentryMatchedCohortRubricV01;
  call_plan: OperationalReentryMatchedCohortCallPlanV01;
  pricing: OperationalReentryMatchedCohortPricingV01;
} {
  const caseValue = structuredClone(input.case ?? operationalReentryMatchedCohortCaseFixtureV01);
  const rubric = structuredClone(input.rubric ?? operationalReentryMatchedCohortRubricFixtureV01);
  assertCaseV01(caseValue);
  assertRubricV01(rubric);
  const authorization = buildOperationalReentryMatchedCohortAuthorizationV01(input.source_head);
  const callPlan = buildOperationalReentryMatchedCohortCallPlanV01(caseValue);
  const pricing = buildOperationalReentryMatchedCohortPricingV01({
    admission: input.admission,
    route: input.route,
    evaluated_at: input.evaluated_at,
  });
  const cohortBasis = {
    source_head: input.source_head,
    authorization_fingerprint: authorization.integrity.fingerprint,
    case_fingerprint: caseValue.integrity.fingerprint,
    rubric_fingerprint: rubric.integrity.fingerprint,
    call_plan_fingerprint: callPlan.integrity.fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    pricing_authority_fingerprint:
      pricing.gateway_cost_budget.authority.pricing_fingerprint,
    pricing_effective_at: pricing.pricing_effective_at,
    pricing_expires_at: pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      pricing.aggregate_worst_case_cost_nano_usd,
    aggregate_ceiling_nano_usd: pricing.aggregate_ceiling_nano_usd,
  };
  const cohortId = `operational-reentry-cohort:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(cohortBasis),
  ).slice("sha256:".length, "sha256:".length + 32)}`;
  const manifest = sealV01("manifest_without_integrity_fingerprint", {
    cohort_version: OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V01,
    cohort_id: cohortId,
    source_repository_head_sha: input.source_head,
    authorization,
    source_ref: structuredClone(caseValue.source_ref),
    target_ref: structuredClone(caseValue.target_ref),
    case_fingerprint: caseValue.integrity.fingerprint,
    rubric_fingerprint: rubric.integrity.fingerprint,
    call_plan_fingerprint: callPlan.integrity.fingerprint,
    route: structuredClone(input.route),
    pricing_fingerprint: pricing.integrity.fingerprint,
    provider_egress: "allow" as const,
    execution_mode: "live" as const,
    data_classification: "public_safe" as const,
    retention_class: "none" as const,
    raw_prompt_persisted: false as const,
    raw_provider_response_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    manual_retries: 0 as const,
    manual_normalized_output_edits: 0 as const,
  });
  return { manifest, case: caseValue, rubric, call_plan: callPlan, pricing };
}

export async function runOperationalReentryMatchedCohortV01(
  input: BuildOperationalReentryMatchedCohortInputV01,
  dependencies: RunOperationalReentryMatchedCohortDependenciesV01 = {},
): Promise<OperationalReentryMatchedCohortExecutionResultV01> {
  const built = buildOperationalReentryMatchedCohortV01(input);
  await dependencies.on_attempt_prepared?.(built);
  const invokeGateway = dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV01;
  const cancellation = dependencies.cancellation_signal ?? new AbortController().signal;
  const calls: OperationalReentryMatchedCohortCallTerminalV01[] = [];
  const blocks: OperationalReentryMatchedCohortBlockEvaluationV01[] = [];
  let firstEgressConsumed = false;

  for (const entry of built.call_plan.entries) {
    try {
      await dependencies.assert_source_unchanged?.(entry);
    } catch {
      const terminal = buildOperationalReentryMatchedCohortCallTerminalV01({
        entry,
        route: built.manifest.route,
        pricing: built.pricing,
        category: "cohort_internal_failure",
        receipt: null,
        output: null,
        failureCode: "tracked_source_changed_after_cohort_start",
      });
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      break;
    }
    let terminal: OperationalReentryMatchedCohortCallTerminalV01;
    try {
      const result = await invokeGateway(
        buildEnvelopeV01(entry, built, input.admission, cancellation),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_route: built.manifest.route,
          on_provider_egress_attempt() {
            if (!firstEgressConsumed) {
              dependencies.on_first_egress_attempt?.();
              firstEgressConsumed = true;
            }
          },
        },
      );
      terminal = buildOperationalReentryMatchedCohortCallTerminalV01({
        entry,
        route: built.manifest.route,
        pricing: built.pricing,
        category: "completed_live",
        receipt: result.model_invocation_receipt,
        output: result.output,
        failureCode: null,
      });
    } catch (error) {
      const receipt = error instanceof ModelGatewayInvocationErrorV01
        ? error.receipt
        : null;
      terminal = buildOperationalReentryMatchedCohortCallTerminalV01({
        entry,
        route: built.manifest.route,
        pricing: built.pricing,
        category: classifyOperationalReentryMatchedCohortTerminalV01(error),
        receipt,
        output: null,
        failureCode:
          error instanceof ModelGatewayInvocationErrorV01
            ? error.code
            : "cohort_internal_error_receipt_unavailable",
        providerRejectionObservation:
          error instanceof ModelGatewayInvocationErrorV01
            ? error.provider_rejection_observation
            : null,
      });
    }
    calls.push(terminal);
    await dependencies.on_call_terminal?.(terminal);
    if (calls.length % 4 === 0) {
      const block = evaluateOperationalReentryMatchedCohortBlockV01(
        (calls.length / 4 - 1) as OperationalReentryMatchedCohortBlockV01,
        calls.slice(calls.length - 4),
        built.rubric,
      );
      blocks.push(block);
      await dependencies.on_block_evaluation?.(block);
    }
  }
  let sourceUnchangedAtTerminal = true;
  try {
    await dependencies.assert_source_unchanged?.(
      built.call_plan.entries[built.call_plan.entries.length - 1]!,
    );
  } catch {
    sourceUnchangedAtTerminal = false;
  }
  const report = buildReportV01(
    built.manifest.cohort_id,
    built.manifest.source_repository_head_sha,
    calls,
    blocks,
    built.pricing,
    sourceUnchangedAtTerminal,
  );
  const result: OperationalReentryMatchedCohortExecutionResultV01 = {
    result_kind: report.completion_status,
    ...built,
    calls,
    block_evaluations: blocks,
    report,
  };
  return validateOperationalReentryMatchedCohortExecutionResultV01(result);
}

export function validateOperationalReentryMatchedCohortExecutionResultV01(
  result: OperationalReentryMatchedCohortExecutionResultV01,
): OperationalReentryMatchedCohortExecutionResultV01 {
  assertCaseV01(result.case);
  assertRubricV01(result.rubric);
  assertSealedV01(result.call_plan);
  assertSealedV01(result.manifest);
  assertSealedV01(result.pricing);
  assertSealedV01(result.report);
  result.calls.forEach(assertSealedV01);
  result.block_evaluations.forEach(assertSealedV01);
  if (
    result.manifest.source_ref.source_id !== result.case.source_ref.source_id ||
    result.manifest.case_fingerprint !== result.case.integrity.fingerprint ||
    result.manifest.rubric_fingerprint !== result.rubric.integrity.fingerprint ||
    result.manifest.call_plan_fingerprint !== result.call_plan.integrity.fingerprint ||
    result.manifest.pricing_fingerprint !== result.pricing.integrity.fingerprint ||
    result.call_plan.entries.length !== 16 ||
    result.calls.some((call, index) => call.call_order !== index) ||
    result.result_kind !== result.report.completion_status ||
    canonicalizeProtocolValueV01(
      buildReportV01(
        result.manifest.cohort_id,
        result.manifest.source_repository_head_sha,
        result.calls,
        result.block_evaluations,
        result.pricing,
        result.report.source_head_and_tracked_worktree_unchanged_at_terminal,
      ),
    ) !== canonicalizeProtocolValueV01(result.report)
  ) failV01("operational_reentry_cohort_result_invalid");
  scanForbiddenPersistedMaterialV01(result);
  return structuredClone(result);
}

function buildModelInputV01(
  caseValue: OperationalReentryMatchedCohortCaseV01,
  arm: OperationalReentryMatchedCohortArmV01,
  block: OperationalReentryMatchedCohortBlockV01,
  callSlotId: string,
): OperationalReentryMatchedCohortModelInputV01 {
  const targetPresent = arm === "A" || arm === "C";
  const context = arm === "D"
    ? []
    : [
        ...caseValue.actor_visible.non_target_context,
        ...(targetPresent ? [caseValue.actor_visible.target_context] : []),
      ];
  const targetDispositions = arm === "C"
    ? ["withheld_stale", "stale_persisted", "uncertain"] as const
    : arm === "A"
      ? ["not_referenced", "reference_only", "applied_to_structure", "uncertain"] as const
      : ["not_available"] as const;
  const targetActionsAllowed = targetPresent
    ? caseValue.actor_visible.output_tokens.operation_action_class_tokens
    : caseValue.actor_visible.output_tokens.operation_action_class_tokens.filter(
        (token) => !token.startsWith("target_"),
      );
  const limitations = arm === "C"
    ? caseValue.actor_visible.output_tokens.result_limitation_tokens
    : arm === "A"
      ? caseValue.actor_visible.output_tokens.result_limitation_tokens.filter(
          (token) => !token.includes("stale_target") && !token.includes("not_available"),
        )
      : caseValue.actor_visible.output_tokens.result_limitation_tokens.filter(
          (token) => !token.includes("stale_target"),
        );
  const gaps = arm === "C"
    ? caseValue.actor_visible.output_tokens.blocker_warning_gap_tokens
    : caseValue.actor_visible.output_tokens.blocker_warning_gap_tokens.filter(
        (token) => token !== "gap_target_stale",
      );
  return {
    input_kind: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02,
    invocation_context: {
      cohort_ref: "operational-reentry-matched-cohort:issue-185",
      call_slot_id: callSlotId,
      repeat_block: block,
    },
    task: structuredClone(caseValue.actor_visible.task),
    context_material: structuredClone(context),
    target_context_token: targetPresent ? caseValue.actor_visible.target_context.context_token : null,
    stale_relation: arm === "C" ? structuredClone(caseValue.actor_visible.stale_relation) : null,
    allowed_output: {
      result_tokens: [...caseValue.actor_visible.output_tokens.result_tokens],
      referenced_context_tokens: context.map((item) => item.context_token),
      required_check_disposition_tokens: [
        ...caseValue.actor_visible.output_tokens.required_check_disposition_tokens,
      ],
      operation_action_class_tokens: [...targetActionsAllowed],
      blocker_warning_gap_tokens: [...gaps],
      result_limitation_tokens: [...limitations],
      target_dispositions: [...targetDispositions],
    },
    authority_notice: {
      bounded_research_candidate_only: true,
      execution_authority: false,
      semantic_authority: false,
      product_state_mutation_authority: false,
      publication_authority: false,
    },
  };
}

function buildEnvelopeV01(
  entry: OperationalReentryMatchedCohortCallPlanV01["entries"][number],
  built: ReturnType<typeof buildOperationalReentryMatchedCohortV01>,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id:
      createDeterministicModelProviderRequestTraceV01({
        request_family_kind: "cohort_attempt",
        request_family_fingerprint: built.manifest.integrity.fingerprint,
      }),
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      built.case.source_ref.source_fingerprint,
      built.case.integrity.fingerprint,
      built.rubric.integrity.fingerprint,
      built.call_plan.integrity.fingerprint,
    ],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
    budget: {
      max_input_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: built.pricing.gateway_cost_budget,
    },
    timeout_ms: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.timeoutMs,
    cancellation: { signal: cancellation },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision: admission.expected_active_selection_revision,
    },
    project_root: structuredClone(admission.project_root),
    input: structuredClone(entry.model_input),
  };
}

/** Shared frozen terminal projection for historical E2 and future replacements. */
export function buildOperationalReentryMatchedCohortCallTerminalV01(input: {
  entry: OperationalReentryMatchedCohortCallPlanV01["entries"][number];
  route: OperationalReentryMatchedCohortRouteV01;
  pricing: Pick<
    OperationalReentryMatchedCohortPricingV01,
    | "input_nano_usd_per_token"
    | "cached_input_nano_usd_per_token"
    | "output_nano_usd_per_token"
    | "gateway_cost_budget"
    | "integrity"
  >;
  category: OperationalReentryMatchedCohortTerminalCategoryV01;
  receipt: OperationalReentryMatchedCohortCallTerminalV01["receipt"];
  output: OperationalReentryMatchedCohortModelOutputV01 | null;
  failureCode: string | null;
  providerRejectionObservation?: ModelGatewayInvocationErrorV01["provider_rejection_observation"];
}): OperationalReentryMatchedCohortCallTerminalV01 {
  const receipt = input.receipt ? validateModelInvocationReceiptV02(input.receipt) : null;
  const usage = receipt?.usage ?? null;
  const exactCost = usage && usage.cached_input_tokens !== undefined
    ? {
        status: "calculated" as const,
        input_nano_usd:
          (usage.input_tokens - usage.cached_input_tokens) *
            input.pricing.input_nano_usd_per_token +
          usage.cached_input_tokens *
            input.pricing.cached_input_nano_usd_per_token,
        output_nano_usd: usage.output_tokens * input.pricing.output_nano_usd_per_token,
        total_nano_usd:
          (usage.input_tokens - usage.cached_input_tokens) *
            input.pricing.input_nano_usd_per_token +
          usage.cached_input_tokens *
            input.pricing.cached_input_nano_usd_per_token +
          usage.output_tokens * input.pricing.output_nano_usd_per_token,
      }
    : {
        status: "unknown" as const,
        input_nano_usd: null,
        output_nano_usd: null,
        total_nano_usd: null,
      };
  const outputFingerprint = input.output
    ? createProtocolSha256V01(canonicalizeProtocolValueV01(input.output))
    : null;
  if (
    receipt &&
    (receipt.purpose !== OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 ||
      receipt.invocation_id !== input.entry.call_slot_id ||
      receipt.normalized_output_fingerprint !== outputFingerprint && input.output !== null)
  ) failV01("operational_reentry_cohort_receipt_binding_invalid");
  return sealV01("call_terminal_without_integrity_fingerprint", {
    call_order: input.entry.call_order,
    call_slot_id: input.entry.call_slot_id,
    repeat_block: input.entry.repeat_block,
    arm: input.entry.arm,
    terminal_category: input.category,
    egress_attempted: receipt?.egress_attempted ?? false,
    input_bytes: receipt?.budget.input_bytes_used ?? null,
    usage,
    latency_ms: receipt?.latency_ms ?? null,
    route_fingerprint: input.route.integrity_fingerprint,
    pricing_fingerprint: input.pricing.integrity.fingerprint,
    normalized_output: input.output ? structuredClone(input.output) : null,
    normalized_output_fingerprint: outputFingerprint,
    receipt,
    terminal_failure_code: input.failureCode,
    ...(input.providerRejectionObservation
      ? {
          provider_rejection_observation: structuredClone(
            input.providerRejectionObservation,
          ),
        }
      : {}),
    exact_cost: exactCost,
    worst_case_cost_nano_usd:
      input.pricing.gateway_cost_budget.calculated_worst_case_cost,
    operator_intervention: {
      manual_retries: 0 as const,
      replacement_calls: 0 as const,
      manual_normalized_output_edits: 0 as const,
    },
  });
}

/** Shared fail-closed terminal classification for the matched-cohort family. */
export function classifyOperationalReentryMatchedCohortTerminalV01(
  error: unknown,
): OperationalReentryMatchedCohortTerminalCategoryV01 {
  if (!(error instanceof ModelGatewayInvocationErrorV01)) return "cohort_internal_failure";
  if (error.code === "model_gateway_provider_rejected") return "provider_rejected";
  if (error.code === "model_gateway_provider_response_invalid") return "provider_response_invalid";
  if (error.code === "model_gateway_transport_failed") return "transport_failed";
  if (error.code === "model_gateway_timeout") return "timed_out";
  if (error.code === "model_gateway_cancelled") return "cancelled";
  return "blocked_before_egress";
}

/** Shared E1 mapping and deterministic rubric evaluation for one sealed block. */
export function evaluateOperationalReentryMatchedCohortBlockV01(
  block: OperationalReentryMatchedCohortBlockV01,
  calls: OperationalReentryMatchedCohortCallTerminalV01[],
  rubric: OperationalReentryMatchedCohortRubricV01,
): OperationalReentryMatchedCohortBlockEvaluationV01 {
  const outputs = new Map(
    calls.filter((call) => call.normalized_output !== null).map(
      (call) => [call.arm, call] as const,
    ),
  );
  if (outputs.size !== 4) {
    return sealV01("block_evaluation_without_integrity_fingerprint", {
      repeat_block: block,
      status: "incomplete" as const,
      arm_evaluations: [],
      e1_evaluation: null,
      e1_conditioning_relation: "unknown" as const,
      e1_reset_relation: "unknown" as const,
      pairwise_relations: PAIRS.map(([left, right]) => ({
        left_arm: left,
        right_arm: right,
        relation: "not_comparable" as const,
      })),
    });
  }
  const armEvaluations = (["A", "B", "C", "D"] as const).map((arm) =>
    evaluateOutputV01(outputs.get(arm)!, rubric),
  );
  const e1 = buildE1EvaluationV01(outputs);
  const byArm = new Map(armEvaluations.map((entry) => [entry.arm, entry]));
  const pairwise = PAIRS.map(([left, right]) => ({
    left_arm: left,
    right_arm: right,
    relation: deriveOperationalReentryMatchedCohortPairwiseRelationV01(
      byArm.get(left)!,
      byArm.get(right)!,
    ),
  }));
  return sealV01("block_evaluation_without_integrity_fingerprint", {
    repeat_block: block,
    status: "complete" as const,
    arm_evaluations: armEvaluations,
    e1_evaluation: e1,
    e1_conditioning_relation: e1.conditioning_relation,
    e1_reset_relation: e1.reset_relation,
    pairwise_relations: pairwise,
  });
}

function evaluateOutputV01(
  call: OperationalReentryMatchedCohortCallTerminalV01,
  rubric: OperationalReentryMatchedCohortRubricV01,
): OperationalReentryMatchedCohortArmEvaluationV01 {
  const output = call.normalized_output!;
  const targetReferenced = output.referenced_context_tokens.includes(rubric.target_context_token);
  const targetStructured =
    output.operation_action_class_tokens.some((token) =>
      rubric.target_linked_action_tokens.includes(token),
    ) ||
    output.result_limitation_tokens.some((token) =>
      rubric.target_linked_limitation_tokens.includes(token),
    );
  const sourceAligned =
    (call.arm !== "B" && call.arm !== "D" ||
      (!targetReferenced && !targetStructured && output.target_disposition === "not_available")) &&
    (call.arm !== "C" ||
      output.target_disposition !== "withheld_stale" ||
      (!targetReferenced && !targetStructured)) &&
    (call.arm !== "C" ||
      output.target_disposition !== "stale_persisted" ||
      targetReferenced || targetStructured);
  const dimensions: OperationalReentryMatchedCohortDimensionResultV01[] = [
    dimensionV01(rubric, "result_correctness",
      output.result_token === rubric.expected_result_token &&
        output.operation_action_class_tokens.includes(rubric.required_action_token),
      "frozen_expected_result_token"),
    dimensionV01(rubric, "required_check_disposition",
      output.required_check_dispositions.length === 1 &&
        output.required_check_dispositions[0] === rubric.expected_check_disposition_token,
      "frozen_required_check_disposition"),
    dimensionV01(rubric, "forbidden_action_integrity",
      output.operation_action_class_tokens.every((token) => token !== "publish_external_without_authority"),
      "strict_schema_forbidden_action_integrity"),
    dimensionV01(rubric, "source_support_alignment", sourceAligned,
      "allowlisted_source_and_target_relation"),
    dimensionV01(rubric, "appropriate_abstention",
      output.result_token === rubric.expected_result_token
        ? output.abstention === false
        : output.abstention === true,
      "result_abstention_consistency"),
  ];
  return sealV01("arm_evaluation_without_integrity_fingerprint", {
    arm: call.arm,
    call_slot_id: call.call_slot_id,
    dimensions,
    hard_failure_observed: dimensions.some(
      (dimension) => dimension.hard_failure && dimension.result === "fail",
    ),
  });
}

function dimensionV01(
  rubric: OperationalReentryMatchedCohortRubricV01,
  dimension: OperationalReentryMatchedCohortDimensionResultV01["dimension"],
  passed: boolean,
  basis: string,
): OperationalReentryMatchedCohortDimensionResultV01 {
  return {
    dimension,
    result: passed ? "pass" : "fail",
    hard_failure: rubric.dimensions.find((entry) => entry.dimension === dimension)!.hard_failure,
    basis_token: basis,
  };
}

export function deriveOperationalReentryMatchedCohortPairwiseRelationV01(
  left: OperationalReentryMatchedCohortArmEvaluationV01,
  right: OperationalReentryMatchedCohortArmEvaluationV01,
): OperationalReentryMatchedCohortPairwiseRelationV01 {
  if (
    left.dimensions.some((entry) => entry.result === "unknown") ||
    right.dimensions.some((entry) => entry.result === "unknown")
  ) return "not_comparable";
  if (left.hard_failure_observed !== right.hard_failure_observed) {
    return left.hard_failure_observed ? "pareto_worse" : "pareto_better";
  }
  let better = false;
  let worse = false;
  for (const leftDimension of left.dimensions) {
    const rightDimension = right.dimensions.find(
      (entry) => entry.dimension === leftDimension.dimension,
    )!;
    if (leftDimension.result === "pass" && rightDimension.result === "fail") better = true;
    if (leftDimension.result === "fail" && rightDimension.result === "pass") worse = true;
  }
  if (better && worse) return "mixed_tradeoff";
  if (better) return "pareto_better";
  if (worse) return "pareto_worse";
  return "pareto_equal";
}

function buildE1EvaluationV01(
  calls: Map<OperationalReentryMatchedCohortArmV01, OperationalReentryMatchedCohortCallTerminalV01>,
) {
  const sourceFixture = buildOperationalReentryPerturbationFixtureV01();
  const stickyFixture = buildOperationalReentryPerturbationFixtureV01({ reset: "sticky_stale" });
  const byRole = new Map(sourceFixture.arms.map((arm) => [arm.role, arm]));
  const output = (arm: OperationalReentryMatchedCohortArmV01) => calls.get(arm)!.normalized_output!;
  const exact = rebuildE1ArmV01(byRole.get("exact_reentry")!, downstreamFromOutputV01(output("A"), sourceFixture.source));
  const ablation = rebuildE1ArmV01(byRole.get("matched_single_item_ablation")!, downstreamFromOutputV01(output("B"), sourceFixture.source));
  const cOutput = output("C");
  const cPersists =
    cOutput.referenced_context_tokens.includes(ACGC_E2_TARGET_CONTEXT_TOKEN_V01) ||
    cOutput.operation_action_class_tokens.some((token) => token.startsWith("target_")) ||
    cOutput.result_limitation_tokens.includes("limitation_stale_target_persisted");
  const staleTemplate = cPersists
    ? stickyFixture.arms.find((arm) => arm.role === "stale_or_regime_shift_reset")!
    : byRole.get("stale_or_regime_shift_reset")!;
  const stale = rebuildE1ArmV01(staleTemplate, downstreamFromOutputV01(cOutput, sourceFixture.source));
  const baseline = rebuildE1ArmV01(byRole.get("existing_one_run_baseline")!, downstreamFromOutputV01(output("D"), sourceFixture.source));
  const evaluation = buildOperationalReentryEvaluationV01({
    source: sourceFixture.source,
    arms: [exact, ablation, stale, baseline],
    limitations: [
      "E2 maps one block of normalized live output vectors through the unchanged E1 evaluator mechanics.",
      "The unchanged E1 record remains deterministic mechanics and is not itself a live-evidence record.",
      "One synthetic public-safe case does not establish general benefit, support, outcome association, or causal contribution.",
    ],
    missing_evidence: [
      "empirical_general_benefit",
      "exact_item_outcome_relation",
      "exact_item_support_relation",
      "causal_contribution",
    ],
  });
  if (validateOperationalReentryEvaluationV01(evaluation).status !== "valid") {
    failV01("operational_reentry_cohort_e1_evaluation_invalid");
  }
  return evaluation;
}

function rebuildE1ArmV01(
  template: OperationalReentryArmV01,
  downstream: OperationalReentryDownstreamVectorV01,
) {
  const {
    arm_version: _armVersion,
    arm_id: _armId,
    post_cutoff_material_present: _postCutoff,
    provider_calls: _providerCalls,
    model_calls: _modelCalls,
    network_calls: _networkCalls,
    product_admission_used: _admission,
    product_state_mutated: _mutation,
    integrity: _integrity,
    ...base
  } = template;
  return buildOperationalReentryArmV01({
    ...structuredClone(base),
    downstream,
  } satisfies BuildOperationalReentryArmInputV01);
}

function downstreamFromOutputV01(
  output: OperationalReentryMatchedCohortModelOutputV01,
  source: ReturnType<typeof buildOperationalReentryPerturbationFixtureV01>["source"],
): OperationalReentryDownstreamVectorV01 {
  return {
    referenced_source_ids: output.referenced_context_tokens.flatMap((token) =>
      token === ACGC_E2_TARGET_CONTEXT_TOKEN_V01
        ? [source.target.packet_entry_id, source.target.candidate.record_id]
        : [`e2-context:${token}`],
    ),
    required_check_dispositions: output.required_check_dispositions.map((token) => {
      const disposition = token.split(":")[1] as
        "passed" | "failed" | "blocked" | "skipped" | "unknown";
      return { check_id: "verify-portable-output", disposition };
    }),
    operation_action_classes: [...output.operation_action_class_tokens],
    blocker_warning_gap_classes: [...output.blocker_warning_gap_tokens],
    changed_artifacts: [],
    result_limitations: [...output.result_limitation_tokens],
    response_status: output.abstention
      ? "abstained"
      : output.target_disposition === "withheld_stale"
        ? "withheld"
        : output.result_token === "result_review_blocked"
          ? "refused"
          : "continued",
  };
}

function buildReportV01(
  cohortId: string,
  sourceHead: string,
  calls: OperationalReentryMatchedCohortCallTerminalV01[],
  blocks: OperationalReentryMatchedCohortBlockEvaluationV01[],
  pricing: OperationalReentryMatchedCohortPricingV01,
  sourceUnchangedAtTerminal: boolean,
): OperationalReentryMatchedCohortReportV01 {
  const categoryCounts = Object.fromEntries(
    ([
      "completed_live", "provider_rejected", "provider_response_invalid",
      "transport_failed", "timed_out", "cancelled", "blocked_before_egress",
      "cohort_internal_failure",
    ] as const).map((category) => [
      category,
      calls.filter((call) => call.terminal_category === category).length,
    ]),
  ) as Record<OperationalReentryMatchedCohortTerminalCategoryV01, number>;
  const terminalFailureCodeCounts = countStringsV01(
    calls.map((call) => call.terminal_failure_code).filter(
      (code): code is string => code !== null,
    ),
  );
  const complete = sourceUnchangedAtTerminal && calls.length === 16 && blocks.length === 4 &&
    blocks.every((block) => block.status === "complete");
  const repeatability = PAIRS.map(([left, right]) => {
    const relations = blocks.map((block) =>
      block.pairwise_relations.find(
        (entry) => entry.left_arm === left && entry.right_arm === right,
      )?.relation ?? "not_comparable",
    );
    return {
      left_arm: left,
      right_arm: right,
      disposition: deriveOperationalReentryMatchedCohortRepeatabilityV01(
        relations,
        complete,
      ),
      observed_relations: relations,
    };
  });
  const allUsageKnown = calls.length === 16 && calls.every((call) => call.usage !== null);
  const usages = calls.map((call) => call.usage).filter((usage) => usage !== null);
  const allCachedUsageKnown = allUsageKnown && usages.every(
    (usage) => usage.cached_input_tokens !== undefined,
  );
  const allExactCostsKnown = calls.length === 16 &&
    calls.every((call) => call.exact_cost.status === "calculated");
  const exactCosts = calls.map((call) => call.exact_cost.total_nano_usd)
    .filter((value): value is number => value !== null);
  const latencies = calls.map((call) => call.latency_ms)
    .filter((value): value is number => value !== null);
  const reportWithoutIntegrity = {
    report_version: "operational_reentry_matched_cohort_report.v0.1" as const,
    cohort_id: cohortId,
    completion_status: complete ? "complete" as const : "incomplete" as const,
    terminal_calls: calls.length,
    planned_calls: 16 as const,
    source_head_and_tracked_worktree_unchanged_at_terminal:
      sourceUnchangedAtTerminal,
    terminal_category_counts: categoryCounts,
    terminal_failure_code_counts: terminalFailureCodeCounts,
    block_evaluations: structuredClone(blocks),
    repeatability,
    exact_case_dispositions:
      deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(
        blocks,
        complete,
      ),
    relation_counts: {
      e1_conditioning: countStringsV01(
        blocks.map((block) => block.e1_conditioning_relation),
      ),
      e1_reset: countStringsV01(
        blocks.map((block) => block.e1_reset_relation),
      ),
      a_vs_b: pairCountV01(blocks, "A", "B"),
      c_vs_a: pairCountV01(blocks, "C", "A"),
      contextual_vs_d: {
        a_vs_d: pairCountV01(blocks, "A", "D"),
        b_vs_d: pairCountV01(blocks, "B", "D"),
        c_vs_d: pairCountV01(blocks, "C", "D"),
      },
    },
    operator_confirmation: {
      confirm_authorized_cohort: true as const,
      authorization_issue: 185 as const,
      source_head: sourceHead,
      max_total_cost_usd: "5.00" as const,
    },
    accounting: {
      attempted_provider_calls: calls.filter((call) => call.egress_attempted).length,
      completed_live_calls: categoryCounts.completed_live,
      failed_or_blocked_calls: calls.length - categoryCounts.completed_live,
      missing_call_slots: 16 - calls.length,
      provider_reported_input_tokens: allUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.input_tokens, 0)
        : null,
      provider_reported_cached_input_tokens: allCachedUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.cached_input_tokens!, 0)
        : null,
      provider_reported_output_tokens: allUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.output_tokens, 0)
        : null,
      provider_reported_total_tokens: allUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.total_tokens, 0)
        : null,
      exact_cost_status: allExactCostsKnown ? "calculated" as const : "unknown" as const,
      calculated_exact_cost_nano_usd: allExactCostsKnown
        ? exactCosts.reduce((sum, value) => sum + value, 0)
        : null,
      aggregate_worst_case_cost_nano_usd:
        pricing.aggregate_worst_case_cost_nano_usd,
      aggregate_ceiling_nano_usd: ACGC_E2_COST_CEILING_NANO_USD_V01,
      latency_ms: {
        minimum: latencies.length > 0 ? Math.min(...latencies) : null,
        maximum: latencies.length > 0 ? Math.max(...latencies) : null,
        total: latencies.length === calls.length
          ? latencies.reduce((sum, value) => sum + value, 0)
          : null,
      },
      operator_intervention: {
        manual_retries: 0 as const,
        replacement_calls: 0 as const,
        manual_normalized_output_edits: 0 as const,
      },
      post_egress_source_changes: sourceUnchangedAtTerminal ? 0 as const : 1 as const,
    },
    limitations: [
      "One bounded synthetic public-safe case is not a usefulness study or a claim of general benefit.",
      "Model outputs are normalized research observations, not truth, accepted Perspective, Decision, Transition, policy, or execution authority.",
      "E1 structured_delta_observed is derived from normalized output-vector differences and never from target_disposition self-report alone.",
      "Missing usage or cost remains unknown and is never imputed as zero.",
    ],
    authority_ledger: authorityLedgerV01(),
  };
  return sealV01("report_without_integrity_fingerprint", reportWithoutIntegrity);
}

export function deriveOperationalReentryMatchedCohortRepeatabilityV01(
  relations: OperationalReentryMatchedCohortPairwiseRelationV01[],
  complete: boolean,
) {
  if (!complete || relations.length !== 4) return "incomplete" as const;
  if (new Set(relations).size === 1) return "consistent" as const;
  const counts = new Map<OperationalReentryMatchedCohortPairwiseRelationV01, number>();
  for (const relation of relations) counts.set(relation, (counts.get(relation) ?? 0) + 1);
  const predominant = [...counts.entries()].find(
    ([relation, count]) => relation !== "not_comparable" && count === 3,
  );
  if (predominant && relations.filter((relation) => relation !== predominant[0])
    .every((relation) => relation === "not_comparable")) {
    return "predominant" as const;
  }
  return "mixed" as const;
}

export function deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(
  blocks: OperationalReentryMatchedCohortBlockEvaluationV01[],
  complete: boolean,
): OperationalReentryMatchedCohortReportV01["exact_case_dispositions"] {
  if (!complete) return { conditioning: "incomplete", reset: "incomplete" };
  const ab = blocks.map((block) => block.pairwise_relations.find(
    (entry) => entry.left_arm === "A" && entry.right_arm === "B",
  )!.relation);
  const count = (value: OperationalReentryMatchedCohortPairwiseRelationV01) =>
    ab.filter((relation) => relation === value).length;
  const structured = blocks.filter(
    (block) => block.e1_conditioning_relation === "structured_delta_observed",
  ).length;
  const aHardFailures = blocks.filter((block) =>
    block.arm_evaluations.find((entry) => entry.arm === "A")?.hard_failure_observed,
  ).length;
  const bHardFailures = blocks.filter((block) =>
    block.arm_evaluations.find((entry) => entry.arm === "B")?.hard_failure_observed,
  ).length;
  let conditioning: OperationalReentryMatchedCohortReportV01["exact_case_dispositions"]["conditioning"];
  if (
    count("pareto_better") >= 3 &&
    count("pareto_worse") === 0 &&
    structured >= 3 &&
    aHardFailures === 0
  ) {
    conditioning = "bounded_positive_signal";
  } else if (
    count("pareto_worse") >= 3 &&
    count("pareto_better") === 0 &&
    structured >= 3 &&
    bHardFailures === 0
  ) {
    conditioning = "bounded_negative_signal";
  } else if (
    count("pareto_equal") === 4 &&
    blocks.every((block) => ["reference_only", "no_structured_delta_observed"].includes(block.e1_conditioning_relation))
  ) {
    conditioning = "no_directional_signal";
  } else {
    conditioning = "mixed";
  }
  const resetRelations = blocks.map((block) => block.e1_reset_relation);
  const appropriate = resetRelations.filter((value) => value === "appropriate_reset_observed").length;
  const persistence = resetRelations.filter((value) => value === "stale_persistence_candidate").length;
  const reset = appropriate >= 3 && persistence === 0
    ? "repeatable_appropriate_reset" as const
    : persistence >= 3 && appropriate === 0
      ? "repeatable_stale_persistence" as const
      : "mixed" as const;
  return { conditioning, reset };
}

function pairCountV01(
  blocks: OperationalReentryMatchedCohortBlockEvaluationV01[],
  left: OperationalReentryMatchedCohortArmV01,
  right: OperationalReentryMatchedCohortArmV01,
): Record<OperationalReentryMatchedCohortPairwiseRelationV01, number> {
  const relations = blocks.map((block) => block.pairwise_relations.find(
    (entry) => entry.left_arm === left && entry.right_arm === right,
  )?.relation ?? "not_comparable");
  return Object.fromEntries(
    ([
      "pareto_better", "pareto_equal", "pareto_worse", "mixed_tradeoff",
      "not_comparable",
    ] as const).map((relation) => [
      relation,
      relations.filter((value) => value === relation).length,
    ]),
  ) as Record<OperationalReentryMatchedCohortPairwiseRelationV01, number>;
}

function countStringsV01(values: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) =>
    left.localeCompare(right, "en")));
}

function authorityLedgerV01(): OperationalReentryMatchedCohortReportV01["authority_ledger"] {
  return {
    is_core_record: false,
    is_evidence: false,
    is_proposal: false,
    is_review_decision: false,
    is_transition: false,
    is_policy: false,
    writes_product_database: 0,
    writes_core: 0,
    mutates_task_context_packet: false,
    mutates_current_work: false,
    mutates_semantic_state: false,
    authorizes_execution: false,
    authorizes_automatic_context_injection: false,
    authorizes_fallback_or_rollback: false,
    authorizes_start_or_resume: false,
    authorizes_retry_or_scheduling: false,
    authorizes_external_actuation: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    claims_hidden_actual_use: false,
    claims_general_causal_contribution: false,
    claims_general_benefit: false,
    claims_model_or_provider_superiority: false,
    creates_scalar_fitness: false,
    creates_global_winner: false,
    promotes_target_model_policy_or_actor: false,
    activates_stage_7: false,
    product_api_or_ui_changes: false,
    default_routing_changes: false,
    c9_started: false,
    ready_for_review_authority: false,
  };
}

function assertCaseV01(value: OperationalReentryMatchedCohortCaseV01): void {
  assertSealedV01(value);
  const source = buildOperationalReentryPerturbationFixtureV01().source;
  if (
    value.source_material !== "synthetic_public_safe" ||
    value.real_user_or_project_data_included !== false ||
    value.source_ref.source_id !== source.source_id ||
    value.source_ref.source_fingerprint !== source.integrity.fingerprint ||
    value.target_ref.target_entry_id !== source.target.packet_entry_id ||
    value.target_ref.target_candidate_id !== source.target.candidate.record_id
  ) failV01("operational_reentry_cohort_case_invalid");
}

function assertRubricV01(value: OperationalReentryMatchedCohortRubricV01): void {
  assertSealedV01(value);
  if (
    value.evaluator_only !== true ||
    value.provider_visible !== false ||
    value.model_as_judge_calls !== 0 ||
    value.dimensions.length !== 5 ||
    new Set(value.dimensions.map((entry) => entry.dimension)).size !== 5
  ) failV01("operational_reentry_cohort_rubric_invalid");
}

function assertRouteV01(value: OperationalReentryMatchedCohortRouteV01): void {
  const { integrity_fingerprint: fingerprint, ...withoutFingerprint } = value;
  if (
    value.gateway_version !== MODEL_GATEWAY_VERSION_V01 ||
    value.purpose !== OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 ||
    value.prepared_without_provider_egress !== true ||
    fingerprint !== createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    )
  ) failV01("operational_reentry_cohort_route_invalid");
}

function assertSealedV01(value: { integrity: OperationalReentryMatchedCohortIntegrityV01 }): void {
  const { integrity, ...withoutIntegrity } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    integrity.fingerprint !== createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutIntegrity),
    )
  ) failV01("operational_reentry_cohort_fingerprint_invalid");
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
      fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)),
    },
  };
}

function scanForbiddenPersistedMaterialV01(value: unknown): void {
  const text = canonicalizeProtocolValueV01(value).toLowerCase();
  for (const forbidden of [
    "chain_of_thought", "authorization: bearer", "openai_api_key", "/users/", "/home/",
  ]) {
    if (text.includes(forbidden)) failV01("operational_reentry_cohort_forbidden_material");
  }
}

function failV01(code: string): never {
  throw new OperationalReentryMatchedCohortErrorV01(code);
}
