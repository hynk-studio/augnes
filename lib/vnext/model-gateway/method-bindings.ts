import { type StateEntry } from "@/lib/db";
import {
  assertModelEgressTextIsSafe,
  cloneBoundedModelEgressJson,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import {
  GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
  GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type GovernedActorLabModelInvocationEnvelopeV01,
  type GuideBriefInterpretationModelInvocationEnvelopeV01,
  type ModelAdapterImplementationV01,
  type ModelAdapterInvocationResultV01,
  type ModelGatewayPurposeV01,
  type ModelInvocationEnvelopeV01,
  type ObserveModelInvocationEnvelopeV01,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV01,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV02,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV03,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV04,
  type OperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01,
  type PlannerModelInvocationEnvelopeV01,
  type StrategicAdvantageTransferModelInvocationEnvelopeV01,
  type TemporalModelInvocationEnvelopeV01,
} from "@/lib/vnext/model-gateway/contracts";
import { validateModelGatewayCostBudgetV01 } from "@/lib/vnext/model-gateway/cost-authority";
import { GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01, validateGovernedActorLabModelInputV01 } from "@/lib/vnext/model-gateway/openai/governed-actor-lab-codec";
import { GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01 } from "@/lib/vnext/model-gateway/openai/guide-brief-interpretation-codec";
import { OBSERVE_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/observe-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01, validateOperationalReentryMatchedCohortModelInputV01 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02, validateOperationalReentryMatchedCohortModelInputV02 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03, validateOperationalReentryMatchedCohortModelInputV03 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04, validateOperationalReentryMatchedCohortInvocationV04 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import { OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01, validateOperationalReentryStaleResetCrossCaseInvocationV01 } from "@/lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import { PLANNER_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/planner-codec";
import { STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/strategic-advantage-transfer-codec";
import { TEMPORAL_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/temporal-codec";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { type OperationalReentryMatchedCohortInvocationV04 } from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import { type OperationalReentryStaleResetCrossCaseInvocationV01 } from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

import type { GatewayCommonEnvelopeV01, GatewayMethodBindingV01 } from "./invocation-core";
import {
  invalid,
  readOwn,
  requireExactKeys,
  requirePlainRecord,
} from "./invocation-guards";
import { createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04, createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01 } from "./method-routes";
export const DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01 =
  "deterministic.observe" as const;
export const DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01 =
  "deterministic_observe.v0.1" as const;
export const DETERMINISTIC_PLANNER_IMPLEMENTATION_ID_V01 =
  "deterministic.planner" as const;
export const DETERMINISTIC_PLANNER_IMPLEMENTATION_VERSION_V01 =
  "deterministic_planner.v0.1" as const;
export const DETERMINISTIC_TEMPORAL_IMPLEMENTATION_ID_V01 =
  "deterministic.temporal" as const;
export const DETERMINISTIC_TEMPORAL_IMPLEMENTATION_VERSION_V01 =
  "deterministic_temporal.v0.1" as const;
export const DETERMINISTIC_STRATEGIC_IMPLEMENTATION_ID_V01 =
  "deterministic.strategic-unavailable" as const;
export const DETERMINISTIC_STRATEGIC_IMPLEMENTATION_VERSION_V01 =
  "deterministic_strategic_unavailable.v0.1" as const;
export const DETERMINISTIC_GUIDE_BRIEF_INTERPRETATION_IMPLEMENTATION_ID_V01 =
  "deterministic.guidebrief-interpretation-unavailable" as const;
export const DETERMINISTIC_GUIDE_BRIEF_INTERPRETATION_IMPLEMENTATION_VERSION_V01 =
  "deterministic_guidebrief_interpretation_unavailable.v0.1" as const;
export const DETERMINISTIC_GOVERNED_ACTOR_LAB_IMPLEMENTATION_ID_V01 =
  "deterministic.governed-actor-lab-unavailable" as const;
export const DETERMINISTIC_GOVERNED_ACTOR_LAB_IMPLEMENTATION_VERSION_V01 =
  "deterministic_governed_actor_lab_unavailable.v0.1" as const;
export const DETERMINISTIC_OPERATIONAL_REENTRY_MATCHED_COHORT_IMPLEMENTATION_ID_V01 =
  "deterministic.operational-reentry-matched-cohort-unavailable" as const;
export const DETERMINISTIC_OPERATIONAL_REENTRY_MATCHED_COHORT_IMPLEMENTATION_VERSION_V01 =
  "deterministic_operational_reentry_matched_cohort_unavailable.v0.1" as const;

const PROVIDER_CONTROL_KEYS = new Set([
  "api_key",
  "authorization",
  "developer_prompt",
  "endpoint",
  "endpoint_url",
  "function",
  "functions",
  "model",
  "model_id",
  "model_identifier",
  "provider",
  "provider_id",
  "response_format",
  "response_schema",
  "role",
  "roles",
  "system_prompt",
  "tool",
  "tools",
]);

function isOperationalReentryMatchedCohortPurposeV01(
  purpose: unknown,
): purpose is
  | typeof OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  | typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  | typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  | typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  | typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01 {
  return (
    purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  );
}

function completeMethodEnvelope(purpose: ModelGatewayPurposeV01, common: GatewayCommonEnvelopeV01, rawPurposeInput: unknown, providerRequestTraceId: string | null): ModelInvocationEnvelopeV01 {
  const executionMode = common.execution_mode;
  const dataClassification = common.data_classification;
  const projectId = common.project_id;
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return { ...common, purpose, input: purposeInput };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return { ...common, purpose, input: purposeInput };
  }
  if (purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      dataClassification !== "public_safe" ||
      common.privacy.provider_egress !== "allow" ||
      common.privacy.retention_class !== "none" ||
      common.budget.max_input_bytes !==
      GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.finalRequestBytes ||
      common.budget.max_output_tokens !==
      GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.maxOutputTokens ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !==
      GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.timeoutMs
    ) {
      invalid();
    }
    const purposeInput = validatePurposeInput(
      rawPurposeInput,
      purpose,
      projectId,
    );
    validatePurposeInputSafety(purpose, purposeInput);
    return { ...common, purpose, input: purposeInput };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      dataClassification !== "public_safe" ||
      common.privacy.provider_egress !== "allow" ||
      common.privacy.retention_class !== "none" ||
      common.budget.max_input_bytes !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes ||
      common.budget.max_output_tokens !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.timeoutMs ||
      common.budget.cost_budget === undefined
    ) invalid();
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return {
      ...common,
      purpose,
      provider_request_trace_id: providerRequestTraceId!,
      input: purposeInput,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      dataClassification !== "public_safe" ||
      common.privacy.provider_egress !== "allow" ||
      common.privacy.retention_class !== "none" ||
      common.budget.max_input_bytes !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes ||
      common.budget.max_output_tokens !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.timeoutMs ||
      common.budget.cost_budget === undefined
    ) invalid();
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return {
      ...common,
      purpose,
      provider_request_trace_id: providerRequestTraceId!,
      input: purposeInput,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      dataClassification !== "public_safe" ||
      common.privacy.provider_egress !== "allow" ||
      common.privacy.retention_class !== "none" ||
      common.budget.max_input_bytes !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes ||
      common.budget.max_output_tokens !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.timeoutMs ||
      common.budget.cost_budget === undefined
    ) invalid();
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return {
      ...common,
      purpose,
      provider_request_trace_id: providerRequestTraceId!,
      input: purposeInput,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      dataClassification !== "public_safe" ||
      common.privacy.provider_egress !== "allow" ||
      common.privacy.retention_class !== "none" ||
      common.budget.max_input_bytes !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes ||
      common.budget.max_output_tokens !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.timeoutMs ||
      common.budget.cost_budget === undefined
    ) invalid();
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return {
      ...common,
      purpose,
      provider_request_trace_id: providerRequestTraceId!,
      input: purposeInput,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      dataClassification !== "public_safe" ||
      common.privacy.provider_egress !== "allow" ||
      common.privacy.retention_class !== "none" ||
      common.budget.max_input_bytes !==
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.finalRequestBytes ||
      common.budget.max_output_tokens !==
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.maxOutputTokens ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !==
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.timeoutMs ||
      common.budget.cost_budget === undefined
    ) invalid();
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return {
      ...common,
      purpose,
      provider_request_trace_id: providerRequestTraceId!,
      input: purposeInput,
    };
  }
  if (
    purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive" ||
      !["public_safe", "private"].includes(dataClassification) ||
      common.budget.max_input_bytes !==
      GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.finalRequestBytes ||
      common.budget.max_output_tokens !== 256 ||
      common.budget.max_provider_calls !== 1 ||
      common.timeout_ms !== 8_000
    ) {
      invalid();
    }
    const purposeInput = validatePurposeInput(
      rawPurposeInput,
      purpose,
      projectId,
    );
    validatePurposeInputSafety(purpose, purposeInput);
    return { ...common, purpose, input: purposeInput };
  }
  if (
    purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
  ) {
    if (
      executionMode !== "live" ||
      common.policy.invocation_origin !== "interactive"
    ) {
      invalid();
    }
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return { ...common, purpose, input: purposeInput };
  }
  const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
  validatePurposeInputSafety(purpose, purposeInput);
  return { ...common, purpose, input: purposeInput };
}
function deterministicImplementation(
  purpose: ModelGatewayPurposeV01,
): ModelAdapterImplementationV01 {
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01,
      implementation_version: DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01,
    };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: DETERMINISTIC_PLANNER_IMPLEMENTATION_ID_V01,
      implementation_version: DETERMINISTIC_PLANNER_IMPLEMENTATION_VERSION_V01,
    };
  }
  if (purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: DETERMINISTIC_STRATEGIC_IMPLEMENTATION_ID_V01,
      implementation_version:
        DETERMINISTIC_STRATEGIC_IMPLEMENTATION_VERSION_V01,
    };
  }
  if (purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id:
        DETERMINISTIC_GUIDE_BRIEF_INTERPRETATION_IMPLEMENTATION_ID_V01,
      implementation_version:
        DETERMINISTIC_GUIDE_BRIEF_INTERPRETATION_IMPLEMENTATION_VERSION_V01,
    };
  }
  if (purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id:
        DETERMINISTIC_GOVERNED_ACTOR_LAB_IMPLEMENTATION_ID_V01,
      implementation_version:
        DETERMINISTIC_GOVERNED_ACTOR_LAB_IMPLEMENTATION_VERSION_V01,
    };
  }
  if (isOperationalReentryMatchedCohortPurposeV01(purpose)) {
    return {
      implementation_id:
        DETERMINISTIC_OPERATIONAL_REENTRY_MATCHED_COHORT_IMPLEMENTATION_ID_V01,
      implementation_version:
        DETERMINISTIC_OPERATIONAL_REENTRY_MATCHED_COHORT_IMPLEMENTATION_VERSION_V01,
    };
  }
  return {
    implementation_id: DETERMINISTIC_TEMPORAL_IMPLEMENTATION_ID_V01,
    implementation_version: DETERMINISTIC_TEMPORAL_IMPLEMENTATION_VERSION_V01,
  };
}

function maximumInputBytesForPurpose(purpose: ModelGatewayPurposeV01) {
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes;
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes;
  }
  if (purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01) {
    return STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.finalRequestBytes;
  }
  if (purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01) {
    return GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.finalRequestBytes;
  }
  if (purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    return GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.finalRequestBytes;
  }
  if (
    purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.finalRequestBytes;
  }
  return TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes;
}

function validatePurposeInput(
  value: unknown,
  purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): ObserveModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): PlannerModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): TemporalModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): StrategicAdvantageTransferModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): GuideBriefInterpretationModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): GovernedActorLabModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV02["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV03["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV04["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): OperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: ModelGatewayPurposeV01,
  projectId: string,
): ModelInvocationEnvelopeV01["input"] {
  const record = requirePlainRecord(value);
  if (purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    const validated = validateGovernedActorLabModelInputV01(record);
    assertNoProviderControlFields(validated);
    return validated;
  }
  if (
    purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const validated = validateOperationalReentryMatchedCohortModelInputV01(record);
    assertNoProviderControlFields(validated);
    return validated;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const validated = validateOperationalReentryMatchedCohortModelInputV02(record);
    assertNoOperationalReentryMatchedCohortV02ProviderControlFields(validated);
    return validated;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const validated = validateOperationalReentryMatchedCohortModelInputV03(record);
    assertNoOperationalReentryMatchedCohortProviderControlFieldsV03(validated);
    return validated;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const validated = validateOperationalReentryMatchedCohortInvocationV04(record);
    assertNoOperationalReentryMatchedCohortProviderControlFieldsV04(validated);
    return validated;
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const validated =
      validateOperationalReentryStaleResetCrossCaseInvocationV01(record);
    assertNoOperationalReentryStaleResetCrossCaseProviderControlFieldsV01(
      validated,
    );
    return validated;
  }
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    requireExactKeys(record, ["input_kind", "message", "current_state"]);
    if (readOwn(record, "input_kind") !== purpose) invalid();
    const message = readOwn(record, "message");
    const currentState = readOwn(record, "current_state");
    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > OBSERVE_MODEL_EGRESS_LIMITS.messageCharacters ||
      !Array.isArray(currentState) ||
      currentState.length > OBSERVE_MODEL_EGRESS_LIMITS.stateItems
    ) {
      invalid();
    }
    validateProjectScopedStateInput(currentState as StateEntry[], projectId);
    return { input_kind: purpose, message, current_state: currentState as StateEntry[] };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    requireExactKeys(record, ["input_kind", "message", "brief"]);
    if (readOwn(record, "input_kind") !== purpose) invalid();
    const message = readOwn(record, "message");
    const brief = requirePlainRecord(readOwn(record, "brief"));
    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > PLANNER_MODEL_EGRESS_LIMITS.messageBytes ||
      readOwn(brief, "scope") !== projectId
    ) {
      invalid();
    }
    validatePlannerBriefScopes(brief, projectId);
    assertNoProviderControlFields(brief);
    return {
      input_kind: purpose,
      message,
      brief: brief as PlannerModelInvocationEnvelopeV01["input"]["brief"],
    };
  }
  if (purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01) {
    requireExactKeys(record, [
      "input_kind",
      "utterance",
      "candidates",
      "previous_answer_anchor",
    ]);
    if (readOwn(record, "input_kind") !== purpose) invalid();
    const utterance = readOwn(record, "utterance");
    const candidates = readOwn(record, "candidates");
    const previousAnswerAnchor = readOwn(record, "previous_answer_anchor");
    if (
      typeof utterance !== "string" ||
      utterance.trim().length === 0 ||
      Buffer.byteLength(utterance, "utf8") >
      GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.utteranceBytes ||
      !Array.isArray(candidates) ||
      candidates.length < 1 ||
      candidates.length >
      GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.candidateItems
    ) {
      invalid();
    }
    const tokens = new Set<string>();
    for (const candidate of candidates) {
      const candidateRecord = requirePlainRecord(candidate);
      requireExactKeys(candidateRecord, [
        "candidate_token",
        "public_meaning",
        "semantic_description",
        "currently_available",
      ]);
      const token = readOwn(candidateRecord, "candidate_token");
      if (
        typeof token !== "string" ||
        !/^c_[a-f0-9]{32}$/u.test(token) ||
        tokens.has(token) ||
        readOwn(candidateRecord, "currently_available") !== true ||
        !boundedProviderSafeTextV01(
          readOwn(candidateRecord, "public_meaning"),
          GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.candidateTextBytes,
        ) ||
        !boundedProviderSafeTextV01(
          readOwn(candidateRecord, "semantic_description"),
          GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.candidateTextBytes,
        )
      ) {
        invalid();
      }
      tokens.add(token);
    }
    if (previousAnswerAnchor !== null) {
      const anchor = requirePlainRecord(previousAnswerAnchor);
      requireExactKeys(anchor, ["anchor_kind", "public_subject"]);
      if (
        readOwn(anchor, "anchor_kind") !==
        "immediately_previous_successful_guidebrief_answer" ||
        !boundedProviderSafeTextV01(
          readOwn(anchor, "public_subject"),
          GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.candidateTextBytes,
        )
      ) {
        invalid();
      }
    }
    if (!boundedGuideBriefUtteranceV01(utterance)) invalid();
    return {
      input_kind: purpose,
      utterance,
      candidates:
        candidates as GuideBriefInterpretationModelInvocationEnvelopeV01["input"]["candidates"],
      previous_answer_anchor:
        previousAnswerAnchor as GuideBriefInterpretationModelInvocationEnvelopeV01["input"]["previous_answer_anchor"],
    };
  }
  if (purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01) {
    requireExactKeys(record, [
      "input_kind",
      "profile_version",
      "schema_version",
      "working_frame",
      "source_catalog",
      "lenses",
      "budget",
    ]);
    if (readOwn(record, "input_kind") !== purpose) invalid();
    const profileVersion = readOwn(record, "profile_version");
    const schemaVersion = readOwn(record, "schema_version");
    const workingFrame = requirePlainRecord(readOwn(record, "working_frame"));
    const sourceCatalog = requirePlainRecord(readOwn(record, "source_catalog"));
    const lenses = readOwn(record, "lenses");
    const budget = requirePlainRecord(readOwn(record, "budget"));
    if (
      profileVersion !== "strategic_advantage_transfer.v0.1" ||
      schemaVersion !== "strategic_advantage_transfer_model_output.v0.1" ||
      !Array.isArray(lenses) ||
      lenses.length < 1 ||
      lenses.length > 3 ||
      new Set(lenses).size !== lenses.length ||
      lenses.some(
        (lens) =>
          ![
            "constraint_fit",
            "verification_leverage",
            "regression_safety",
          ].includes(String(lens)),
      ) ||
      typeof readOwn(workingFrame, "working_frame_fingerprint") !== "string" ||
      typeof readOwn(sourceCatalog, "source_catalog_fingerprint") !== "string" ||
      !Array.isArray(readOwn(sourceCatalog, "items")) ||
      (readOwn(sourceCatalog, "items") as unknown[]).length > 64
    ) {
      invalid();
    }
    validateStrategicProfileBudget(budget);
    assertNoStrategicProviderControlFields(record);
    return record as unknown as StrategicAdvantageTransferModelInvocationEnvelopeV01["input"];
  }
  requireExactKeys(record, ["input_kind", "context"]);
  if (readOwn(record, "input_kind") !== purpose) invalid();
  const context = requirePlainRecord(readOwn(record, "context"));
  requireExactKeys(context, [
    "scope",
    "as_of",
    "current_interpretation",
    "active_prior_context",
    "evidence_anchors",
    "summary_refs",
    "source_authority_profile",
    "counterexamples",
    "residual_tensions",
    "user_preferences",
    "safe_next_step",
    "non_authority_boundary",
    "active_context_admission_rationale",
    "active_context_admission",
    "suppressed_alternatives",
    "temporal_hierarchy_view",
    "memory_lifecycle_view",
    "interpretive_drivers",
    "axis_pressures",
  ]);
  if (readOwn(context, "scope") !== projectId) invalid();
  assertNoProviderControlFields(context);
  return {
    input_kind: purpose,
    context: context as TemporalModelInvocationEnvelopeV01["input"]["context"],
  };
}

function validatePurposeInputSafety(
  purpose: ModelGatewayPurposeV01,
  input: ModelInvocationEnvelopeV01["input"],
) {
  const value =
    input.input_kind === PLANNER_MODEL_GATEWAY_PURPOSE_V01
      ? { message: input.message }
      : input;
  const cloned = cloneBoundedModelEgressJson(purpose, value, {
    maximumDepth: 12,
    maximumNodes: 4_096,
  });
  const serialized = serializeModelEgressJson(purpose, cloned, 196_608);
  assertModelEgressTextIsSafe(purpose, serialized);
}

function boundedProviderSafeTextV01(
  value: unknown,
  maximumBytes: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    Buffer.byteLength(value, "utf8") <= maximumBytes &&
    boundedGuideBriefUtteranceV01(value)
  );
}

function boundedGuideBriefUtteranceV01(value: string): boolean {
  return ![
    /(?:https?:\/\/|file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/u,
    /\b(?:workspace|project|candidate|proposal|request|receipt|run|work):[A-Za-z0-9:._-]+\b/u,
    /\b(?:sha256:)?[a-f0-9]{64}\b/iu,
    /\b(?:endpoint|route|selector|cookie|nonce|fingerprint|source[_ -]?ref|api[_ -]?key|authorization)\b/iu,
  ].some((pattern) => pattern.test(value));
}

function validateProjectScopedStateInput(state: StateEntry[], projectId: string) {
  for (let index = 0; index < state.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(state, String(index));
    if (!descriptor || !("value" in descriptor)) invalid();
    const item = requirePlainRecord(descriptor.value);
    if (
      readOwn(item, "scope") !== projectId ||
      typeof readOwn(item, "state_key") !== "string"
    ) {
      invalid();
    }
  }
}

function validatePlannerBriefScopes(
  brief: Record<string, unknown>,
  projectId: string,
) {
  for (const key of [
    "active_state",
    "future_state",
    "completed_state",
    "deprecated_state",
    "open_tensions",
    "pending_proposals",
  ]) {
    const value = readOwn(brief, key);
    if (!Array.isArray(value)) invalid();
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor)) invalid();
      const row = requirePlainRecord(descriptor.value);
      if (Object.hasOwn(row, "scope") && readOwn(row, "scope") !== projectId) {
        invalid();
      }
    }
  }
}

function assertNoProviderControlFields(value: unknown) {
  const cloned = cloneBoundedModelEgressJson(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    value,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      if (PROVIDER_CONTROL_KEYS.has(key.toLowerCase())) invalid();
      visit(child);
    }
  };
  visit(cloned);
}

function assertNoOperationalReentryMatchedCohortV02ProviderControlFields(
  value: unknown,
): void {
  const cloned = cloneBoundedModelEgressJson(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    value,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, `${path}[]`);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      const allowedContinuationSemanticRole =
        path === "$.continuation_context[]" && key === "role";
      if (
        PROVIDER_CONTROL_KEYS.has(key.toLowerCase()) &&
        !allowedContinuationSemanticRole
      ) {
        invalid();
      }
      visit(child, `${path}.${key}`);
    }
  };
  visit(cloned, "$");
}

function assertNoOperationalReentryMatchedCohortProviderControlFieldsV03(
  value: unknown,
): void {
  const cloned = cloneBoundedModelEgressJson(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    value,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, `${path}[]`);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      const allowedContinuationSemanticRole =
        path === "$.continuation_context[]" && key === "role";
      if (
        PROVIDER_CONTROL_KEYS.has(key.toLowerCase()) &&
        !allowedContinuationSemanticRole
      ) {
        invalid();
      }
      visit(child, `${path}.${key}`);
    }
  };
  visit(cloned, "$");
}

function assertNoOperationalReentryMatchedCohortProviderControlFieldsV04(
  value: OperationalReentryMatchedCohortInvocationV04,
): void {
  const cloned = cloneBoundedModelEgressJson(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    value.provider_material,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, `${path}[]`);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      const allowedContinuationSemanticRole =
        path === "$.continuation_context[]" && key === "role";
      if (
        PROVIDER_CONTROL_KEYS.has(key.toLowerCase()) &&
        !allowedContinuationSemanticRole
      ) {
        invalid();
      }
      visit(child, `${path}.${key}`);
    }
  };
  visit(cloned, "$");
}

function assertNoOperationalReentryStaleResetCrossCaseProviderControlFieldsV01(
  value: OperationalReentryStaleResetCrossCaseInvocationV01,
): void {
  const cloned = cloneBoundedModelEgressJson(
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
    value.provider_material,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, `${path}[]`);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      const allowedContinuationSemanticRole =
        path === "$.continuation_context[]" && key === "role";
      if (
        PROVIDER_CONTROL_KEYS.has(key.toLowerCase()) &&
        !allowedContinuationSemanticRole
      ) invalid();
      visit(child, `${path}.${key}`);
    }
  };
  visit(cloned, "$");
}

function validateStrategicProfileBudget(budget: Record<string, unknown>): void {
  requireExactKeys(budget, [
    "budget_version",
    "max_lenses",
    "max_transfer_items",
    "max_source_catalog_items",
    "max_source_refs_per_transfer",
    "max_text_characters",
    "max_total_canonical_utf8_bytes",
    "model",
    "truncation_allowed",
  ]);
  const model = requirePlainRecord(readOwn(budget, "model"));
  requireExactKeys(model, [
    "max_input_bytes",
    "max_output_tokens",
    "max_provider_calls",
    "timeout_ms",
    "automatic_retry",
    "provider_failover",
    "cost",
  ]);
  const cost = requirePlainRecord(readOwn(model, "cost"));
  requireExactKeys(cost, ["status", "budget"]);
  const costBudget = validateModelGatewayCostBudgetV01(
    readOwn(cost, "budget"),
  );
  if (
    readOwn(budget, "budget_version") !==
    "strategic_advantage_transfer_budget.v0.1" ||
    readOwn(budget, "max_lenses") !== 3 ||
    readOwn(budget, "max_transfer_items") !== 3 ||
    readOwn(budget, "max_source_catalog_items") !== 64 ||
    readOwn(budget, "max_source_refs_per_transfer") !== 16 ||
    readOwn(budget, "max_text_characters") !== 1_200 ||
    readOwn(budget, "max_total_canonical_utf8_bytes") !== 98_304 ||
    readOwn(budget, "truncation_allowed") !== false ||
    readOwn(model, "max_input_bytes") !== 65_536 ||
    readOwn(model, "max_output_tokens") !== 2_048 ||
    readOwn(model, "max_provider_calls") !== 1 ||
    readOwn(model, "timeout_ms") !== 20_000 ||
    readOwn(model, "automatic_retry") !== false ||
    readOwn(model, "provider_failover") !== false ||
    readOwn(cost, "status") !== "available" ||
    costBudget.maximum_input_units !== 65_536 ||
    costBudget.maximum_output_units !== 2_048 ||
    costBudget.maximum_invocation_count !== 1 ||
    costBudget.timeout_ms !== 20_000
  ) {
    invalid();
  }
}

function assertNoStrategicProviderControlFields(value: unknown): void {
  const cloned = cloneBoundedModelEgressJson(
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
    value,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, `${path}[]`);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      const allowedProfileBudgetModel = path === "$.budget" && key === "model";
      const allowedBoundCostRoute =
        path.startsWith("$.budget.model.cost.budget.authority") &&
        (key === "provider" || key === "model_ref" || key === "provider_ref");
      if (
        PROVIDER_CONTROL_KEYS.has(key.toLowerCase()) &&
        !allowedProfileBudgetModel &&
        !allowedBoundCostRoute
      ) {
        invalid();
      }
      visit(child, `${path}.${key}`);
    }
  };
  visit(cloned, "$");
}


/** Closed production composition: no registry, registration API, or arbitrary module loading. */
export function readGatewayMethodBindingV01(purpose: ModelGatewayPurposeV01): GatewayMethodBindingV01 {
  const traced = isOperationalReentryMatchedCohortPurposeV01(purpose);
  return {
    purpose,
    maximum_input_bytes: maximumInputBytesForPurpose(purpose),
    maximum_output_tokens: purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
      ? 256
      : purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01
        ? GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.maxOutputTokens
        : purpose ===
          OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
          ? OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens
          : purpose ===
            OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
            ? OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens
            : purpose ===
              OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
              ? OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens
              : purpose ===
                OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
                ? OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens
                : purpose ===
                  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
                  ? OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.maxOutputTokens
                  : MAX_OUTPUT_TOKENS,
    maximum_timeout_ms: purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01 ? 8_000 : 60_000,
    requires_request_trace: traced,
    cost_budget: traced || purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01 ? "required" :
      purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 || purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01 ? "optional" : "forbidden",
    provider_unavailable_fallback: !traced && purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
    deterministic_implementation: deterministicImplementation(purpose),
    complete_envelope: (common, raw, trace) => completeMethodEnvelope(purpose, common, raw, trace),
    cost_input_matches(envelope) {
      return envelope.purpose !== STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01 ||
        (envelope.input.budget.model.cost.status === "available" &&
          canonicalizeProtocolValueV01(envelope.input.budget.model.cost.budget) === canonicalizeProtocolValueV01(envelope.budget.cost_budget));
    },
    local_identity(envelope) {
      if (envelope.purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01) return createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(envelope.input);
      if (envelope.purpose === OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01) return createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01(envelope.input);
      return undefined;
    },
    fingerprinted_output(result) {
      return result.purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01 ||
        result.purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 || isOperationalReentryMatchedCohortPurposeV01(result.purpose)
        ? { value: (result as Extract<ModelAdapterInvocationResultV01, { output: unknown }>).output } : null;
    },
  };
}
const MAX_OUTPUT_TOKENS = 4_096;
