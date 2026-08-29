import {
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01,
  commissionedLiveTrainingRecordRefV01,
  createCommissionedLiveTrainingRecordRefV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import {
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01,
} from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import {
  CODEX_ISOLATED_AUTH_PRODUCTION_MODEL_CONFIGURATION_VERSION_V01,
  createCodexIsolatedAuthTestExecutionAuthorizationV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  type CodexIsolatedAuthenticatedExecutionOwnerV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01,
  type CommissionedLiveTrainingCodexEnvironmentBindingV01,
  type CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
  type CommissionedLiveTrainingExternalExecutionAuthorizationV01,
  type CommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  type CommissionedLiveTrainingScheduleSlotV01,
} from "@/types/vnext/commissioned-controlled-live-training";
import type { CodexIsolatedAuthTestExecutionAuthorizationV01 } from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { NativeHostRequestV01 } from "@/types/vnext/native-host-adapter";

type RuntimeWitnessSourceV01 = ReturnType<
  typeof reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01
>;

interface ProductionAuthorizationSourceV01 {
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  consumed: boolean;
}

const SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01 = new WeakMap<
  object,
  ProductionAuthorizationSourceV01
>();

export class CommissionedLiveTrainingExecutionAuthorizationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedLiveTrainingExecutionAuthorizationErrorV01";
  }
}

export function createCommissionedLiveTrainingTestExecutionAuthorizationV01(input: {
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  invocation_ordinal: number;
  expires_at: string;
}): CodexIsolatedAuthTestExecutionAuthorizationV01 {
  const source = assertAllocationV01(input);
  if (
    ![
      "test_conformance",
      "future_live_control_flow_conformance",
    ].includes(source.authorization.authorization_kind) ||
    input.owner.projection.executable_identity_class !==
      "test_emulated_profile"
  )
    failV01("live_training_test_execution_authorization_refused");
  const grant = createCodexIsolatedAuthTestExecutionAuthorizationV01({
    owner: input.owner,
    request: input.request,
    external_authorization_ref: externalAuthorizationRefV01({
      authorization_id: `${input.attempt_id}-${input.invocation_ordinal}-test`,
      observed_at: source.consumption.consumed_at,
      test_only: true,
    }),
    expires_at: input.expires_at,
  });
  return grant;
}

export function createCommissionedLiveTrainingExternalExecutionAuthorizationV01(input: {
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  invocation_ordinal: number;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  codex_environment_binding: CommissionedLiveTrainingCodexEnvironmentBindingV01;
  expires_at: string;
}): CommissionedLiveTrainingExternalExecutionAuthorizationV01 {
  const source = assertAllocationV01(input);
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01(
    input.codex_environment_binding,
  );
  if (
    source.authorization.authorization_kind !== "future_live_execution" ||
    canonicalizeProtocolValueV01(
      source.authorization.native_execution_configuration,
    ) !== canonicalizeProtocolValueV01(input.native_execution_configuration) ||
    canonicalizeProtocolValueV01(
      source.authorization.codex_environment_binding,
    ) !== canonicalizeProtocolValueV01(input.codex_environment_binding) ||
    input.expires_at !== source.authorization.expires_at ||
    input.invocation_ordinal >
      source.authorization.provider_bearing_native_host_invocation_limit ||
    input.invocation_ordinal >
      source.authorization.model_bearing_native_host_invocation_limit ||
    input.codex_environment_binding.binding_class !==
      "isolated_authenticated_live_execution" ||
    input.owner.projection.executable_identity_class !==
      "production_pinned_codex" ||
    input.owner.projection.integrity.fingerprint !==
      input.codex_environment_binding
        .codex_isolated_auth_projection_fingerprint ||
    input.owner.projection.semantic_profile_fingerprint !==
      input.codex_environment_binding.semantic_profile_fingerprint ||
    input.owner.projection.codex_executable_fingerprint !==
      input.native_execution_configuration.cli_executable_identity
        .content_fingerprint ||
    input.owner.projection.compatible_codex_cli_version !==
      input.native_execution_configuration.expected_cli_version ||
    input.owner.projection.provider_ref.external_id !==
      input.native_execution_configuration.provider_id ||
    input.owner.projection.config_policy.provider_route_fingerprint !==
      input.codex_environment_binding.effective_provider_route_fingerprint
  )
    failV01("live_training_external_execution_authorization_binding_invalid");
  const modelConfigurationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      configuration_version:
        CODEX_ISOLATED_AUTH_PRODUCTION_MODEL_CONFIGURATION_VERSION_V01,
      model: input.native_execution_configuration.model_id,
      reasoning_effort:
        input.native_execution_configuration.reasoning_effort,
      provider_route_fingerprint:
        input.codex_environment_binding.effective_provider_route_fingerprint,
    }),
  );
  const externalAuthorizationRef = externalAuthorizationRefV01({
    authorization_id: `${input.attempt_id}-${input.invocation_ordinal}`,
    observed_at: source.consumption.consumed_at,
    test_only: false,
  });
  const material = {
    authorization_version:
      COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01,
    authorization_kind: "production_external_execution" as const,
    external_authorization_ref: externalAuthorizationRef,
    cohort_authorization_ref: commissionedLiveTrainingRecordRefV01(
      source.authorization,
    ),
    authorization_consumption_ref: createCommissionedLiveTrainingRecordRefV01({
      record_version: source.consumption.consumption_version,
      record_id: source.consumption.consumption_id,
      record_fingerprint: source.consumption.integrity.fingerprint,
    }),
    runtime_consumption_witness_fingerprint:
      input.witness.witness_identity_fingerprint,
    slot_id: input.slot.slot_id,
    attempt_id: input.attempt_id,
    attempt_kind: input.attempt_kind,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    root_scope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.request.root_scope),
    ),
    projection_fingerprint: input.owner.projection.integrity.fingerprint,
    execution_environment_fingerprint:
      input.owner.execution_environment_fingerprint,
    provider_ref: structuredClone(input.owner.projection.provider_ref),
    model_configuration_ref: modelConfigurationRefV01(
      modelConfigurationFingerprint,
      source.consumption.consumed_at,
    ),
    effective_route_fingerprint:
      input.codex_environment_binding.effective_provider_route_fingerprint,
    invocation_ordinal: input.invocation_ordinal,
    provider_model_bearing_invocation_ceiling: 1,
    native_execution_configuration_fingerprint:
      input.native_execution_configuration.configuration_fingerprint,
    expected_provider_id: input.native_execution_configuration.provider_id,
    expected_model_id: input.native_execution_configuration.model_id,
    expected_route_id: input.native_execution_configuration.route_id,
    expected_reasoning_effort:
      input.native_execution_configuration.reasoning_effort,
    expires_at: input.expires_at,
    no_fallback: true as const,
    single_use: true as const,
    test_only: false as const,
  };
  let authorization!: CommissionedLiveTrainingExternalExecutionAuthorizationV01;
  authorization = Object.freeze({
    ...material,
    integrity: integrityV01(material),
    consume_for_adapter_v01: (
      adapterInput: Parameters<
        CommissionedLiveTrainingExternalExecutionAuthorizationV01["consume_for_adapter_v01"]
      >[0],
    ) => {
      consumeProductionAuthorizationV01(authorization, adapterInput);
    },
  });
  SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.set(authorization, {
    witness: input.witness,
    owner: input.owner,
    consumed: false,
  });
  return authorization;
}

function assertAllocationV01(input: {
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  invocation_ordinal: number;
}): RuntimeWitnessSourceV01 {
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01(
    input.witness,
  );
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(input.owner);
  const source = reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01({
    witness: input.witness,
    invocation_ordinal: input.invocation_ordinal,
    slot: input.slot,
    attempt_id: input.attempt_id,
    attempt_kind: input.attempt_kind,
  });
  if (
    input.owner.repository_root_fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          version: "codex_isolated_auth_repository_root.v0.1",
          canonical_root: input.request.root_scope.canonical_root,
        }),
      )
  )
    failV01("live_training_external_execution_authorization_allocation_refused");
  return source;
}

function consumeProductionAuthorizationV01(
  authorization: CommissionedLiveTrainingExternalExecutionAuthorizationV01,
  input: Parameters<
    CommissionedLiveTrainingExternalExecutionAuthorizationV01["consume_for_adapter_v01"]
  >[0],
): void {
  const source = SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.get(authorization);
  if (source)
    assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01(
      source.witness,
    );
  if (
    !source ||
    source.consumed ||
    source.owner !== input.owner ||
    authorization.request_id !== input.request_id ||
    authorization.run_id !== input.run_id ||
    authorization.root_scope_fingerprint !== input.root_scope_fingerprint ||
    authorization.projection_fingerprint !== input.projection_fingerprint ||
    authorization.execution_environment_fingerprint !==
      input.execution_environment_fingerprint ||
    canonicalizeProtocolValueV01(authorization.provider_ref) !==
      canonicalizeProtocolValueV01(input.provider_ref) ||
    authorization.model_configuration_ref.external_id !==
      `codex-isolated-auth-model-configuration:${input.model_configuration_fingerprint}` ||
    authorization.effective_route_fingerprint !==
      input.effective_route_fingerprint
  )
    failV01("live_training_external_execution_authorization_consumption_refused");
  source.consumed = true;
}

function externalAuthorizationRefV01(input: {
  authorization_id: string;
  observed_at: string;
  test_only: boolean;
}): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: input.test_only
      ? "codex_isolated_auth_test_execution_authorization"
      : "commissioned_live_training_external_execution_authorization",
    external_id: input.authorization_id,
    provider: "augnes",
    host: "local",
    observed_at: input.observed_at,
    compatibility_namespace: input.test_only
      ? "codex_isolated_auth_test_external_execution_authorization.v0.1"
      : COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01,
    trust_class: "direct_local_observation",
  };
}

function modelConfigurationRefV01(
  fingerprint: string,
  observedAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "model_configuration",
    external_id: `codex-isolated-auth-model-configuration:${fingerprint}`,
    provider: "codex",
    host: "local",
    observed_at: observedAt,
    compatibility_namespace:
      COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01,
    trust_class: "direct_local_observation",
  };
}

function integrityV01(value: unknown): { algorithm: "sha256"; fingerprint: string } {
  return {
    algorithm: "sha256",
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)),
  };
}

function failV01(code: string): never {
  throw new CommissionedLiveTrainingExecutionAuthorizationErrorV01(code);
}
