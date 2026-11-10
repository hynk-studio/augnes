import {
  GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
  MODEL_GATEWAY_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterSessionV01,
} from "@/lib/vnext/model-gateway/contracts";
import { GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01, validateGovernedActorLabModelInputV01 } from "@/lib/vnext/model-gateway/openai/governed-actor-lab-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01, validateOperationalReentryMatchedCohortModelInputV01 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02, validateOperationalReentryMatchedCohortModelInputV02 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import {
  buildOperationalReentryMatchedCohortProviderContractV03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03,
  validateOperationalReentryMatchedCohortModelInputV03,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import {
  buildOperationalReentryMatchedCohortProviderContractV04,
  createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04 as createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintCodecV04,
  createOperationalReentryMatchedCohortProviderMaterialFingerprintV04 as createOperationalReentryMatchedCohortProviderMaterialFingerprintCodecV04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04,
  validateOperationalReentryMatchedCohortInvocationV04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import {
  buildOperationalReentryStaleResetCrossCaseProviderContractV01,
  createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01 as createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintCodecV01,
  createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01 as createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintCodecV01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01,
  validateOperationalReentryStaleResetCrossCaseInvocationV01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import {
  createOpenAIResponsesAdapterV01,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV01,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04,
  projectOpenAIResponsesOperationalReentryStaleResetCrossCaseRequestV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import type { GovernedActorLabLiveRouteV01 } from "@/types/vnext/governed-actor-lab-live";
import type { OperationalReentryMatchedCohortModelInputV01, OperationalReentryMatchedCohortRouteV01 } from "@/types/vnext/operational-reentry-matched-cohort";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
  type OperationalReentryMatchedCohortModelInputV02,
  type OperationalReentryMatchedCohortRouteV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  type OperationalReentryMatchedCohortModelInputV03,
  type OperationalReentryMatchedCohortProviderContractV03,
  type OperationalReentryMatchedCohortRouteV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  type OperationalReentryMatchedCohortInvocationV04,
  type OperationalReentryMatchedCohortProviderContractV04,
  type OperationalReentryMatchedCohortProviderMaterialV04,
  type OperationalReentryMatchedCohortRouteV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02,
  type OperationalReentryStaleResetCrossCaseInvocationV01,
  type OperationalReentryStaleResetCrossCaseProviderContractV01,
  type OperationalReentryStaleResetCrossCaseProviderMaterialV01,
  type OperationalReentryStaleResetCrossCaseRouteV01,
} from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

import type { ModelGatewayCoreDependenciesV01 } from "./invocation-core";
import { gatewayFailure } from "./invocation-guards";
export {
  GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04, OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01, validateGovernedActorLabModelInputV01, validateOperationalReentryMatchedCohortInvocationV04, validateOperationalReentryMatchedCohortModelInputV01, validateOperationalReentryMatchedCohortModelInputV02, validateOperationalReentryMatchedCohortModelInputV03, validateOperationalReentryStaleResetCrossCaseInvocationV01
};

/** Exposes the frozen v0.3 contract through the shared Gateway ownership boundary. */
export function readOperationalReentryMatchedCohortProviderContractV03():
  OperationalReentryMatchedCohortProviderContractV03 {
  return structuredClone(
    buildOperationalReentryMatchedCohortProviderContractV03(),
  );
}

/** Exposes the identity-separated v0.4 contract without provider egress. */
export function readOperationalReentryMatchedCohortProviderContractV04():
  OperationalReentryMatchedCohortProviderContractV04 {
  return structuredClone(
    buildOperationalReentryMatchedCohortProviderContractV04(),
  );
}

/** Exposes the new cross-case contract through the shared Gateway boundary. */
export function readOperationalReentryStaleResetCrossCaseProviderContractV01(): OperationalReentryStaleResetCrossCaseProviderContractV01 {
  return structuredClone(
    buildOperationalReentryStaleResetCrossCaseProviderContractV01(),
  );
}

/** Exposes exact zero-egress compatibility bindings through the Gateway owner. */
export function readOperationalReentryStaleResetCrossCaseCompatibilityBindingsV01() {
  const contract = buildOperationalReentryStaleResetCrossCaseProviderContractV01();
  return Object.freeze({
    parser_closure_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(contract.per_shape_parser_closure),
    ),
    request_response_bounds_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01,
      ),
    ),
  });
}

export function createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01(
  invocation: OperationalReentryStaleResetCrossCaseInvocationV01,
): string {
  return createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintCodecV01(
    invocation,
  );
}

export function createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01(
  material: OperationalReentryStaleResetCrossCaseProviderMaterialV01,
): string {
  return createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintCodecV01(
    material,
  );
}

/** Preserves codec-owned v0.4 local invocation identity through the shared Gateway. */
export function createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
  invocation: OperationalReentryMatchedCohortInvocationV04,
): string {
  return createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintCodecV04(
    invocation,
  );
}

/** Preserves codec-owned v0.4 provider material identity through the shared Gateway. */
export function createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
  material: OperationalReentryMatchedCohortProviderMaterialV04,
): string {
  return createOperationalReentryMatchedCohortProviderMaterialFingerprintCodecV04(
    material,
  );
}

export function projectOperationalReentryMatchedCohortProviderRequestV01(
  input: OperationalReentryMatchedCohortModelInputV01,
) {
  return projectOpenAIResponsesOperationalReentryMatchedCohortRequestV01(
    input,
  );
}

export function projectOperationalReentryMatchedCohortProviderRequestV02(
  input: OperationalReentryMatchedCohortModelInputV02,
) {
  return projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02(
    input,
  );
}

export function projectOperationalReentryMatchedCohortProviderRequestV03(
  input: OperationalReentryMatchedCohortModelInputV03,
) {
  return projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03(
    input,
  );
}

export function projectOperationalReentryMatchedCohortProviderRequestV04(
  invocation: OperationalReentryMatchedCohortInvocationV04,
) {
  return projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(
    invocation,
  );
}

export function projectOperationalReentryStaleResetCrossCaseProviderRequestV01(
  invocation: OperationalReentryStaleResetCrossCaseInvocationV01,
) {
  return projectOpenAIResponsesOperationalReentryStaleResetCrossCaseRequestV01(
    invocation,
  );
}

/** Read only the configured Planner route for a finite authorization preview.
 * Keep the invocable session inside the Gateway boundary. Invocation still
 * rechecks the admitted provider/model and cost authority before egress. */
export async function preparePlannerModelGatewayRouteV01(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<Pick<ModelAdapterSessionV01, "provider_ref" | "model_ref"> | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const session = await adapter.prepare(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  if (!session) return null;
  if (session.purpose !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
  };
}

/** Prepares and freezes the production route without invoking provider egress. */
export async function prepareGovernedActorLabModelGatewayRouteV01(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<GovernedActorLabLiveRouteV01 | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const controller = new AbortController();
  const session = await adapter.prepare(
    GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
    controller.signal,
  );
  if (!session) return null;
  if (session.purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  const withoutFingerprint = {
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    purpose: GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
    adapter_implementation_id: session.implementation_id,
    adapter_implementation_version: session.implementation_version,
    prepared_without_provider_egress: true as const,
  };
  return {
    ...withoutFingerprint,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function governedActorLabRouteMatchesSessionV01(
  expected: GovernedActorLabLiveRouteV01,
  session: ModelAdapterSessionV01,
): boolean {
  const withoutFingerprint = {
    gateway_version: expected.gateway_version,
    purpose: expected.purpose,
    provider_ref: expected.provider_ref,
    model_ref: expected.model_ref,
    adapter_implementation_id: expected.adapter_implementation_id,
    adapter_implementation_version: expected.adapter_implementation_version,
    prepared_without_provider_egress: expected.prepared_without_provider_egress,
  };
  return (
    expected.gateway_version === MODEL_GATEWAY_VERSION_V01 &&
    expected.purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 &&
    expected.prepared_without_provider_egress === true &&
    expected.integrity_fingerprint ===
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ) &&
    session.purpose === expected.purpose &&
    session.implementation_id === expected.adapter_implementation_id &&
    session.implementation_version === expected.adapter_implementation_version &&
    canonicalizeProtocolValueV01(session.provider_ref) ===
    canonicalizeProtocolValueV01(expected.provider_ref) &&
    canonicalizeProtocolValueV01(session.model_ref) ===
    canonicalizeProtocolValueV01(expected.model_ref)
  );
}

/** Freezes the one E2 provider/model/adapter route without provider egress. */
export async function prepareOperationalReentryMatchedCohortModelGatewayRouteV01(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<OperationalReentryMatchedCohortRouteV01 | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const controller = new AbortController();
  const session = await adapter.prepare(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    controller.signal,
  );
  if (!session) return null;
  if (
    session.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  const withoutFingerprint = {
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
    adapter_implementation_id: session.implementation_id,
    adapter_implementation_version: session.implementation_version,
    prepared_without_provider_egress: true as const,
  };
  return {
    ...withoutFingerprint,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function operationalReentryMatchedCohortRouteMatchesSessionV01(
  expected: OperationalReentryMatchedCohortRouteV01,
  session: ModelAdapterSessionV01,
): boolean {
  const withoutFingerprint = {
    gateway_version: expected.gateway_version,
    purpose: expected.purpose,
    provider_ref: expected.provider_ref,
    model_ref: expected.model_ref,
    adapter_implementation_id: expected.adapter_implementation_id,
    adapter_implementation_version: expected.adapter_implementation_version,
    prepared_without_provider_egress: expected.prepared_without_provider_egress,
  };
  return (
    expected.gateway_version === MODEL_GATEWAY_VERSION_V01 &&
    expected.purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 &&
    expected.prepared_without_provider_egress === true &&
    expected.integrity_fingerprint ===
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ) &&
    session.purpose === expected.purpose &&
    session.implementation_id === expected.adapter_implementation_id &&
    session.implementation_version === expected.adapter_implementation_version &&
    canonicalizeProtocolValueV01(session.provider_ref) ===
    canonicalizeProtocolValueV01(expected.provider_ref) &&
    canonicalizeProtocolValueV01(session.model_ref) ===
    canonicalizeProtocolValueV01(expected.model_ref)
  );
}

/** Freezes the corrected E2R2H provider/model/adapter route without egress. */
export async function prepareOperationalReentryMatchedCohortModelGatewayRouteV02(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<OperationalReentryMatchedCohortRouteV02 | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const controller = new AbortController();
  const session = await adapter.prepare(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    controller.signal,
  );
  if (!session) return null;
  if (
    session.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 ||
    session.implementation_id !==
    "openai_responses.operational_reentry_matched_cohort" ||
    session.implementation_version !==
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.4"
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  const withoutFingerprint = {
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    purpose:
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
    adapter_implementation_id:
      "openai_responses.operational_reentry_matched_cohort" as const,
    adapter_implementation_version:
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.4" as const,
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
    prepared_without_provider_egress: true as const,
  };
  return {
    ...withoutFingerprint,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function operationalReentryMatchedCohortRouteMatchesSessionV02(
  expected: OperationalReentryMatchedCohortRouteV02,
  session: ModelAdapterSessionV01,
): boolean {
  const withoutFingerprint = {
    gateway_version: expected.gateway_version,
    purpose: expected.purpose,
    provider_ref: expected.provider_ref,
    model_ref: expected.model_ref,
    adapter_implementation_id: expected.adapter_implementation_id,
    adapter_implementation_version: expected.adapter_implementation_version,
    provider_contract_version: expected.provider_contract_version,
    prepared_without_provider_egress: expected.prepared_without_provider_egress,
  };
  return (
    expected.gateway_version === MODEL_GATEWAY_VERSION_V01 &&
    expected.purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 &&
    expected.adapter_implementation_id ===
    "openai_responses.operational_reentry_matched_cohort" &&
    expected.adapter_implementation_version ===
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.4" &&
    expected.provider_contract_version ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02 &&
    expected.prepared_without_provider_egress === true &&
    expected.integrity_fingerprint ===
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ) &&
    session.purpose === expected.purpose &&
    session.implementation_id === expected.adapter_implementation_id &&
    session.implementation_version === expected.adapter_implementation_version &&
    canonicalizeProtocolValueV01(session.provider_ref) ===
    canonicalizeProtocolValueV01(expected.provider_ref) &&
    canonicalizeProtocolValueV01(session.model_ref) ===
    canonicalizeProtocolValueV01(expected.model_ref)
  );
}

/** Freezes the parser-closed E2R2P3H provider/model/adapter route without egress. */
export async function prepareOperationalReentryMatchedCohortModelGatewayRouteV03(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<OperationalReentryMatchedCohortRouteV03 | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const controller = new AbortController();
  const session = await adapter.prepare(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    controller.signal,
  );
  if (!session) return null;
  if (
    session.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 ||
    session.implementation_id !==
    "openai_responses.operational_reentry_matched_cohort" ||
    session.implementation_version !==
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.5"
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  const providerContract =
    buildOperationalReentryMatchedCohortProviderContractV03();
  const withoutFingerprint = {
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    purpose:
      OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
    adapter_implementation_id:
      "openai_responses.operational_reentry_matched_cohort" as const,
    adapter_implementation_version:
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.5" as const,
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    provider_contract_fingerprint: providerContract.integrity.fingerprint,
    maximum_canonical_wire_response_bytes:
      providerContract.maximum_canonical_wire_response_bytes,
    response_safety_margin_bytes:
      providerContract.response_safety_margin_bytes,
    response_bytes: providerContract.response_bytes,
    max_output_tokens: providerContract.max_output_tokens,
    prepared_without_provider_egress: true as const,
  };
  return {
    ...withoutFingerprint,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function operationalReentryMatchedCohortRouteMatchesSessionV03(
  expected: OperationalReentryMatchedCohortRouteV03,
  session: ModelAdapterSessionV01,
): boolean {
  const withoutFingerprint = {
    gateway_version: expected.gateway_version,
    purpose: expected.purpose,
    provider_ref: expected.provider_ref,
    model_ref: expected.model_ref,
    adapter_implementation_id: expected.adapter_implementation_id,
    adapter_implementation_version: expected.adapter_implementation_version,
    provider_contract_version: expected.provider_contract_version,
    provider_contract_fingerprint: expected.provider_contract_fingerprint,
    maximum_canonical_wire_response_bytes:
      expected.maximum_canonical_wire_response_bytes,
    response_safety_margin_bytes: expected.response_safety_margin_bytes,
    response_bytes: expected.response_bytes,
    max_output_tokens: expected.max_output_tokens,
    prepared_without_provider_egress: expected.prepared_without_provider_egress,
  };
  return (
    expected.gateway_version === MODEL_GATEWAY_VERSION_V01 &&
    expected.purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 &&
    expected.adapter_implementation_id ===
    "openai_responses.operational_reentry_matched_cohort" &&
    expected.adapter_implementation_version ===
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.5" &&
    expected.provider_contract_version ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03 &&
    expected.provider_contract_fingerprint ===
    buildOperationalReentryMatchedCohortProviderContractV03().integrity
      .fingerprint &&
    expected.maximum_canonical_wire_response_bytes ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.maximum_canonical_wire_response_bytes &&
    expected.response_safety_margin_bytes ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.safety_margin_bytes &&
    expected.response_bytes ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.responseBytes &&
    expected.max_output_tokens ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens &&
    expected.prepared_without_provider_egress === true &&
    expected.integrity_fingerprint ===
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ) &&
    session.purpose === expected.purpose &&
    session.implementation_id === expected.adapter_implementation_id &&
    session.implementation_version === expected.adapter_implementation_version &&
    canonicalizeProtocolValueV01(session.provider_ref) ===
    canonicalizeProtocolValueV01(expected.provider_ref) &&
    canonicalizeProtocolValueV01(session.model_ref) ===
    canonicalizeProtocolValueV01(expected.model_ref)
  );
}

/** Freezes the invocation-identity-separated v0.4 route without egress. */
export async function prepareOperationalReentryMatchedCohortModelGatewayRouteV04(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<OperationalReentryMatchedCohortRouteV04 | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const controller = new AbortController();
  const session = await adapter.prepare(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    controller.signal,
  );
  if (!session) return null;
  if (
    session.purpose !==
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 ||
    session.implementation_id !==
    "openai_responses.operational_reentry_matched_cohort" ||
    session.implementation_version !==
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.6"
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  const providerContract =
    buildOperationalReentryMatchedCohortProviderContractV04();
  const withoutFingerprint = {
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    purpose:
      OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
    adapter_implementation_id:
      "openai_responses.operational_reentry_matched_cohort" as const,
    adapter_implementation_version:
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.6" as const,
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
    provider_contract_fingerprint: providerContract.integrity.fingerprint,
    maximum_canonical_wire_response_bytes:
      providerContract.maximum_canonical_wire_response_bytes,
    response_safety_margin_bytes:
      providerContract.response_safety_margin_bytes,
    response_bytes: providerContract.response_bytes,
    max_output_tokens: providerContract.max_output_tokens,
    prepared_without_provider_egress: true as const,
  };
  return {
    ...withoutFingerprint,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function operationalReentryMatchedCohortRouteMatchesSessionV04(
  expected: OperationalReentryMatchedCohortRouteV04,
  session: ModelAdapterSessionV01,
): boolean {
  const withoutFingerprint = {
    gateway_version: expected.gateway_version,
    purpose: expected.purpose,
    provider_ref: expected.provider_ref,
    model_ref: expected.model_ref,
    adapter_implementation_id: expected.adapter_implementation_id,
    adapter_implementation_version: expected.adapter_implementation_version,
    provider_contract_version: expected.provider_contract_version,
    provider_contract_fingerprint: expected.provider_contract_fingerprint,
    maximum_canonical_wire_response_bytes:
      expected.maximum_canonical_wire_response_bytes,
    response_safety_margin_bytes: expected.response_safety_margin_bytes,
    response_bytes: expected.response_bytes,
    max_output_tokens: expected.max_output_tokens,
    prepared_without_provider_egress: expected.prepared_without_provider_egress,
  };
  return (
    expected.gateway_version === MODEL_GATEWAY_VERSION_V01 &&
    expected.purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 &&
    expected.adapter_implementation_id ===
    "openai_responses.operational_reentry_matched_cohort" &&
    expected.adapter_implementation_version ===
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.6" &&
    expected.provider_contract_version ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04 &&
    expected.provider_contract_fingerprint ===
    buildOperationalReentryMatchedCohortProviderContractV04().integrity
      .fingerprint &&
    expected.maximum_canonical_wire_response_bytes ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04.maximum_canonical_wire_response_bytes &&
    expected.response_safety_margin_bytes ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04.safety_margin_bytes &&
    expected.response_bytes ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.responseBytes &&
    expected.max_output_tokens ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens &&
    expected.prepared_without_provider_egress === true &&
    expected.integrity_fingerprint ===
    createProtocolSha256V01(canonicalizeProtocolValueV01(withoutFingerprint)) &&
    session.purpose === expected.purpose &&
    session.implementation_id === expected.adapter_implementation_id &&
    session.implementation_version === expected.adapter_implementation_version &&
    canonicalizeProtocolValueV01(session.provider_ref) ===
    canonicalizeProtocolValueV01(expected.provider_ref) &&
    canonicalizeProtocolValueV01(session.model_ref) ===
    canonicalizeProtocolValueV01(expected.model_ref)
  );
}

/** Freezes the new cross-case route without provider egress. */
export async function prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01(
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "adapter"> = {},
): Promise<OperationalReentryStaleResetCrossCaseRouteV01 | null> {
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const controller = new AbortController();
  const session = await adapter.prepare(
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
    controller.signal,
  );
  if (!session) return null;
  if (
    session.purpose !==
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01 ||
    session.implementation_id !==
    "openai_responses.operational_reentry_stale_reset_cross_case_replication" ||
    session.implementation_version !==
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02
  ) throw gatewayFailure("model_gateway_provider_response_invalid");
  const contract = buildOperationalReentryStaleResetCrossCaseProviderContractV01();
  const withoutFingerprint = {
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    purpose:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: structuredClone(session.provider_ref),
    model_ref: structuredClone(session.model_ref),
    adapter_implementation_id:
      "openai_responses.operational_reentry_stale_reset_cross_case_replication" as const,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02,
    provider_contract_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02,
    provider_contract_fingerprint: contract.integrity.fingerprint,
    maximum_canonical_wire_response_bytes:
      contract.maximum_canonical_wire_response_bytes,
    response_bytes: contract.response_bytes,
    max_output_tokens: contract.max_output_tokens,
    prepared_without_provider_egress: true as const,
  };
  return {
    ...withoutFingerprint,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function operationalReentryStaleResetCrossCaseRouteMatchesSessionV01(
  expected: OperationalReentryStaleResetCrossCaseRouteV01,
  session: ModelAdapterSessionV01,
): boolean {
  const { integrity_fingerprint: _ignored, ...withoutFingerprint } = expected;
  return (
    expected.gateway_version === MODEL_GATEWAY_VERSION_V01 &&
    expected.purpose ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01 &&
    expected.adapter_implementation_id ===
    "openai_responses.operational_reentry_stale_reset_cross_case_replication" &&
    expected.adapter_implementation_version ===
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02 &&
    expected.provider_contract_version ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02 &&
    expected.provider_contract_fingerprint ===
    buildOperationalReentryStaleResetCrossCaseProviderContractV01().integrity
      .fingerprint &&
    expected.maximum_canonical_wire_response_bytes ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01.maximum_canonical_wire_response_bytes &&
    expected.response_bytes ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.responseBytes &&
    expected.max_output_tokens ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.maxOutputTokens &&
    expected.prepared_without_provider_egress === true &&
    expected.integrity_fingerprint ===
    createProtocolSha256V01(canonicalizeProtocolValueV01(withoutFingerprint)) &&
    session.purpose === expected.purpose &&
    session.implementation_id === expected.adapter_implementation_id &&
    session.implementation_version === expected.adapter_implementation_version &&
    canonicalizeProtocolValueV01(session.provider_ref) ===
    canonicalizeProtocolValueV01(expected.provider_ref) &&
    canonicalizeProtocolValueV01(session.model_ref) ===
    canonicalizeProtocolValueV01(expected.model_ref)
  );
}

