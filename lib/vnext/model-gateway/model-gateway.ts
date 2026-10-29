import type { ModelGatewayCoreDependenciesV01 } from "./invocation-core";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";
import type { TemporalInterpretationPreview } from "@/lib/temporal-interpretation/types";
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
  type GovernedActorLabModelGatewayResultV01,
  type GovernedActorLabModelInvocationEnvelopeV01,
  type GuideBriefInterpretationModelGatewayResultV01,
  type GuideBriefInterpretationModelInvocationEnvelopeV01,
  type ModelInvocationEnvelopeV01,
  type ObserveModelGatewayResultV01,
  type ObserveModelInvocationEnvelopeV01,
  type OperationalReentryMatchedCohortModelGatewayResultV01,
  type OperationalReentryMatchedCohortModelGatewayResultV02,
  type OperationalReentryMatchedCohortModelGatewayResultV03,
  type OperationalReentryMatchedCohortModelGatewayResultV04,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV01,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV02,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV03,
  type OperationalReentryMatchedCohortModelInvocationEnvelopeV04,
  type OperationalReentryStaleResetCrossCaseModelGatewayResultV01,
  type OperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01,
  type PlannerModelGatewayResultV01,
  type PlannerModelInvocationEnvelopeV01,
  type PlannerRecommendationV01,
  type StrategicAdvantageTransferModelGatewayResultV01,
  type StrategicAdvantageTransferModelInvocationEnvelopeV01,
  type TemporalModelGatewayResultV01,
  type TemporalModelInvocationEnvelopeV01,
} from "@/lib/vnext/model-gateway/contracts";
import { createOpenAIResponsesAdapterV01 } from "@/lib/vnext/model-gateway/openai/responses-adapter";
import type { GovernedActorLabLiveRouteV01 } from "@/types/vnext/governed-actor-lab-live";
import type { OperationalReentryMatchedCohortRouteV01 } from "@/types/vnext/operational-reentry-matched-cohort";
import { type OperationalReentryMatchedCohortRouteV02 } from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import { type OperationalReentryMatchedCohortRouteV03 } from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import { type OperationalReentryMatchedCohortRouteV04 } from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import { type OperationalReentryStaleResetCrossCaseRouteV01 } from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

import {
  invokeModelGatewayCoreV01,
  validateModelInvocationEnvelopeCoreV01,
  type InternalModelGatewayDependenciesV01,
} from "./invocation-core";
import { gatewayFailure, invalid } from "./invocation-guards";
import { readGatewayMethodBindingV01 } from "./method-bindings";
import {
  governedActorLabRouteMatchesSessionV01,
  operationalReentryMatchedCohortRouteMatchesSessionV01,
  operationalReentryMatchedCohortRouteMatchesSessionV02,
  operationalReentryMatchedCohortRouteMatchesSessionV03,
  operationalReentryMatchedCohortRouteMatchesSessionV04,
  operationalReentryStaleResetCrossCaseRouteMatchesSessionV01,
} from "./method-routes";
export { readModelGatewayInteractiveAdmissionForRootV01, type ModelGatewayInteractiveAdmissionV01 } from "./invocation-core";
export { readDefaultModelGatewayLocalCapabilityV01, type ModelGatewayLocalCapabilityDiagnosticV01 } from "./local-capability";
export {
  DETERMINISTIC_GOVERNED_ACTOR_LAB_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_GOVERNED_ACTOR_LAB_IMPLEMENTATION_VERSION_V01,
  DETERMINISTIC_GUIDE_BRIEF_INTERPRETATION_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_GUIDE_BRIEF_INTERPRETATION_IMPLEMENTATION_VERSION_V01,
  DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01,
  DETERMINISTIC_OPERATIONAL_REENTRY_MATCHED_COHORT_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_OPERATIONAL_REENTRY_MATCHED_COHORT_IMPLEMENTATION_VERSION_V01,
  DETERMINISTIC_PLANNER_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_PLANNER_IMPLEMENTATION_VERSION_V01,
  DETERMINISTIC_STRATEGIC_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_STRATEGIC_IMPLEMENTATION_VERSION_V01,
  DETERMINISTIC_TEMPORAL_IMPLEMENTATION_ID_V01,
  DETERMINISTIC_TEMPORAL_IMPLEMENTATION_VERSION_V01,
} from "./method-bindings";
export {
  createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04,
  createOperationalReentryMatchedCohortProviderMaterialFingerprintV04,
  createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01,
  createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01,
  GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01,
  prepareGovernedActorLabModelGatewayRouteV01,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV02,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV04,
  prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01,
  preparePlannerModelGatewayRouteV01,
  projectOperationalReentryMatchedCohortProviderRequestV01,
  projectOperationalReentryMatchedCohortProviderRequestV02,
  projectOperationalReentryMatchedCohortProviderRequestV03,
  projectOperationalReentryMatchedCohortProviderRequestV04,
  projectOperationalReentryStaleResetCrossCaseProviderRequestV01,
  readOperationalReentryMatchedCohortProviderContractV03,
  readOperationalReentryMatchedCohortProviderContractV04,
  readOperationalReentryStaleResetCrossCaseCompatibilityBindingsV01,
  readOperationalReentryStaleResetCrossCaseProviderContractV01,
  validateGovernedActorLabModelInputV01,
  validateOperationalReentryMatchedCohortInvocationV04,
  validateOperationalReentryMatchedCohortModelInputV01,
  validateOperationalReentryMatchedCohortModelInputV02,
  validateOperationalReentryMatchedCohortModelInputV03,
  validateOperationalReentryStaleResetCrossCaseInvocationV01,
} from "./method-routes";
export { readPlannerModelGatewayExecutionConfigurationV01 } from "./planner-execution-configuration";
interface SharedModelGatewayDependenciesV01 extends ModelGatewayCoreDependenciesV01 {
  expected_governed_actor_lab_route?: GovernedActorLabLiveRouteV01;
  expected_operational_reentry_matched_cohort_route?: OperationalReentryMatchedCohortRouteV01;
  expected_operational_reentry_matched_cohort_v02_route?: OperationalReentryMatchedCohortRouteV02;
  expected_operational_reentry_matched_cohort_v03_route?: OperationalReentryMatchedCohortRouteV03;
  expected_operational_reentry_matched_cohort_v04_route?: OperationalReentryMatchedCohortRouteV04;
  expected_operational_reentry_stale_reset_cross_case_route?: OperationalReentryStaleResetCrossCaseRouteV01;
}

export interface ObserveModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: ObserveModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) => ValidatedProposal[] | Promise<ValidatedProposal[]>;
}

export interface PlannerModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: PlannerModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) => PlannerRecommendationV01[] | Promise<PlannerRecommendationV01[]>;
}

export interface TemporalModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: TemporalModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) =>
    | TemporalInterpretationPreview
    | Promise<TemporalInterpretationPreview>;
}

export interface StrategicAdvantageTransferModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 { }

export interface GuideBriefInterpretationModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 { }

export interface GovernedActorLabModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 { }

export interface OperationalReentryMatchedCohortModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 { }

export interface OperationalReentryMatchedCohortModelGatewayDependenciesV02
  extends SharedModelGatewayDependenciesV01 { }

export interface OperationalReentryMatchedCohortModelGatewayDependenciesV03
  extends SharedModelGatewayDependenciesV01 { }

export interface OperationalReentryMatchedCohortModelGatewayDependenciesV04
  extends SharedModelGatewayDependenciesV01 { }

export interface OperationalReentryStaleResetCrossCaseModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 { }

export async function invokeObserveModelGatewayV01(
  input: unknown,
  dependencies: ObserveModelGatewayDependenciesV01,
): Promise<ObserveModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    async deterministic_execute(purposeInput, lifecycle) {
      if (purposeInput.input_kind !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
        proposals: await dependencies.deterministic_execute(
          purposeInput,
          lifecycle,
        ),
      };
    },
  });
  if (result.output.purpose !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    compiler: result.execution === "live" ? "openai" : "mock",
    proposals: result.output.proposals,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokePlannerModelGatewayV01(
  input: unknown,
  dependencies: PlannerModelGatewayDependenciesV01,
): Promise<PlannerModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    async deterministic_execute(purposeInput, lifecycle) {
      if (purposeInput.input_kind !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
        recommendations: await dependencies.deterministic_execute(
          purposeInput,
          lifecycle,
        ),
      };
    },
  });
  if (result.output.purpose !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    planner: result.execution === "live" ? "openai" : "mock",
    recommendations: result.output.recommendations,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeTemporalModelGatewayV01(
  input: unknown,
  dependencies: TemporalModelGatewayDependenciesV01,
): Promise<TemporalModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: true,
    async deterministic_execute(purposeInput, lifecycle) {
      if (purposeInput.input_kind !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
        preview: await dependencies.deterministic_execute(
          purposeInput,
          lifecycle,
        ),
      };
    },
  });
  if (result.output.purpose !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    generator:
      result.execution === "live"
        ? "openai"
        : result.execution === "fallback"
          ? "mock_fallback"
          : "mock",
    model:
      result.execution === "live" && "model_identifier" in result.output
        ? result.output.model_identifier
        : null,
    preview: result.output.preview,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeStrategicAdvantageTransferModelGatewayV01(
  input: unknown,
  dependencies: StrategicAdvantageTransferModelGatewayDependenciesV01 = {},
): Promise<StrategicAdvantageTransferModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error("strategic_model_required");
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !==
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
  ) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeGuideBriefInterpretationModelGatewayV01(
  input: unknown,
  dependencies: GuideBriefInterpretationModelGatewayDependenciesV01 = {},
): Promise<GuideBriefInterpretationModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute(purposeInput) {
      if (
        purposeInput.input_kind !==
        GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
      ) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
        output: {
          coverage: "none",
          classification: "unsupported",
          candidate_tokens: [],
        },
      };
    },
  });
  if (
    result.output.purpose !==
    GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    interpreter: result.execution === "live" ? "openai" : "unavailable",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeGovernedActorLabModelGatewayV01(
  input: unknown,
  dependencies: GovernedActorLabModelGatewayDependenciesV01 = {},
): Promise<GovernedActorLabModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error("governed_actor_lab_live_model_required");
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01
  ) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeOperationalReentryMatchedCohortModelGatewayV01(
  input: unknown,
  dependencies: OperationalReentryMatchedCohortModelGatewayDependenciesV01 = {},
): Promise<OperationalReentryMatchedCohortModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error("operational_reentry_matched_cohort_live_model_required");
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeOperationalReentryMatchedCohortModelGatewayV02(
  input: unknown,
  dependencies: OperationalReentryMatchedCohortModelGatewayDependenciesV02 = {},
): Promise<OperationalReentryMatchedCohortModelGatewayResultV02> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error(
        "operational_reentry_matched_cohort_v02_live_model_required",
      );
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeOperationalReentryMatchedCohortModelGatewayV03(
  input: unknown,
  dependencies: OperationalReentryMatchedCohortModelGatewayDependenciesV03 = {},
): Promise<OperationalReentryMatchedCohortModelGatewayResultV03> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error(
        "operational_reentry_matched_cohort_v03_live_model_required",
      );
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeOperationalReentryMatchedCohortModelGatewayV04(
  input: unknown,
  dependencies: OperationalReentryMatchedCohortModelGatewayDependenciesV04 = {},
): Promise<OperationalReentryMatchedCohortModelGatewayResultV04> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error(
        "operational_reentry_matched_cohort_v04_live_model_required",
      );
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeOperationalReentryStaleResetCrossCaseModelGatewayV01(
  input: unknown,
  dependencies: OperationalReentryStaleResetCrossCaseModelGatewayDependenciesV01 = {},
): Promise<OperationalReentryStaleResetCrossCaseModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    deterministic_execute() {
      throw new Error("cross_case_replication_live_model_required");
    },
  });
  if (
    result.execution !== "live" ||
    result.output.purpose !==
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  return {
    generator: "openai",
    output: result.output.output,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export function validateObserveModelInvocationEnvelopeV01(
  input: unknown,
): ObserveModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) invalid();
  return envelope;
}

export function validatePlannerModelInvocationEnvelopeV01(
  input: unknown,
): PlannerModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) invalid();
  return envelope;
}

export function validateTemporalModelInvocationEnvelopeV01(
  input: unknown,
): TemporalModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) invalid();
  return envelope;
}

export function validateStrategicAdvantageTransferModelInvocationEnvelopeV01(
  input: unknown,
): StrategicAdvantageTransferModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
  ) {
    invalid();
  }
  return envelope;
}

export function validateGuideBriefInterpretationModelInvocationEnvelopeV01(
  input: unknown,
): GuideBriefInterpretationModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    invalid();
  }
  return envelope;
}

export function validateGovernedActorLabModelInvocationEnvelopeV01(
  input: unknown,
): GovernedActorLabModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    invalid();
  }
  return envelope;
}

export function validateOperationalReentryMatchedCohortModelInvocationEnvelopeV01(
  input: unknown,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) invalid();
  return envelope;
}

export function validateOperationalReentryMatchedCohortModelInvocationEnvelopeV02(
  input: unknown,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV02 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) invalid();
  return envelope;
}

export function validateOperationalReentryMatchedCohortModelInvocationEnvelopeV03(
  input: unknown,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV03 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) invalid();
  return envelope;
}

export function validateOperationalReentryMatchedCohortModelInvocationEnvelopeV04(
  input: unknown,
): OperationalReentryMatchedCohortModelInvocationEnvelopeV04 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) invalid();
  return envelope;
}

export function validateOperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01(
  input: unknown,
): OperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (
    envelope.purpose !==
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) invalid();
  return envelope;
}


/** Existing synchronous API, composed with the same closed method policies as invocation. */
export function validateModelInvocationEnvelopeV01(input: unknown): ModelInvocationEnvelopeV01 {
  return validateModelInvocationEnvelopeCoreV01(input, readGatewayMethodBindingV01);
}
function invokeModelGatewayV01(input: unknown, dependencies: InternalModelGatewayDependenciesV01 & SharedModelGatewayDependenciesV01) {
  return invokeModelGatewayCoreV01(input, {
    ...dependencies,
    get adapter() { return dependencies.adapter ?? createOpenAIResponsesAdapterV01(); },
    expected_route_status(session, envelope) {
      const purpose = envelope.purpose;
      if (purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 && dependencies.expected_governed_actor_lab_route && !governedActorLabRouteMatchesSessionV01(dependencies.expected_governed_actor_lab_route, session)) return "receipt_refusal";
      if (purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 && dependencies.expected_operational_reentry_matched_cohort_route && !operationalReentryMatchedCohortRouteMatchesSessionV01(dependencies.expected_operational_reentry_matched_cohort_route, session)) return "receipt_refusal";
      if (purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 && dependencies.expected_operational_reentry_matched_cohort_v02_route && !operationalReentryMatchedCohortRouteMatchesSessionV02(dependencies.expected_operational_reentry_matched_cohort_v02_route, session)) return "receipt_refusal";
      if (purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 && dependencies.expected_operational_reentry_matched_cohort_v03_route && !operationalReentryMatchedCohortRouteMatchesSessionV03(dependencies.expected_operational_reentry_matched_cohort_v03_route, session)) return "receipt_refusal";
      if (purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 && dependencies.expected_operational_reentry_matched_cohort_v04_route && !operationalReentryMatchedCohortRouteMatchesSessionV04(dependencies.expected_operational_reentry_matched_cohort_v04_route, session)) return "receipt_refusal";
      if (purpose === OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01 && dependencies.expected_operational_reentry_stale_reset_cross_case_route && !operationalReentryStaleResetCrossCaseRouteMatchesSessionV01(dependencies.expected_operational_reentry_stale_reset_cross_case_route, session)) return "bare_refusal";
      return "matched";
    },
  }, readGatewayMethodBindingV01);
}
