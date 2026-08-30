import {
  assertCommissionedLiveTrainingProductionNativeExecutionConfigurationV01,
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01,
  assertSafeCommissionedLiveTrainingOutputV01,
  commissionedLiveTrainingExecutableIdentityMatchesRawFileFingerprintV01,
  commissionedLiveTrainingRecordRefV01,
  createCommissionedLiveTrainingRecordRefV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import {
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01,
} from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import {
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  type CodexIsolatedAuthenticatedExecutionOwnerV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  CODEX_ISOLATED_AUTH_PRODUCTION_MODEL_CONFIGURATION_VERSION_V01,
  type CodexIsolatedAuthProductionExecutionAuthorizationV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import {
  COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01,
  type CommissionedLiveTrainingCodexEnvironmentBindingV01,
  type CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
  type CommissionedLiveTrainingExternalExecutionAuthorizationV01,
  type CommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  type CommissionedLiveTrainingScheduleSlotV01,
} from "@/types/vnext/commissioned-controlled-live-training";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { NativeHostRequestV01 } from "@/types/vnext/native-host-adapter";

type RuntimeWitnessSourceV01 = ReturnType<
  typeof reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01
>;

interface ProductionAuthorizationSourceV01 {
  source_class: "production" | "source_ownership_contract_test";
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  allocation: RuntimeWitnessSourceV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  invocation_ordinal: number;
  request_id: string;
  run_id: string;
  root_scope_fingerprint: string;
  expected_material: string;
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

export function commissionedLiveTrainingExternalExecutionExecutableBindingMatchesV01(
  input: {
    native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
    codex_executable_fingerprint: string;
  },
): boolean {
  return commissionedLiveTrainingExecutableIdentityMatchesRawFileFingerprintV01({
    identity:
      input.native_execution_configuration.cli_executable_identity,
    raw_file_sha256: input.codex_executable_fingerprint,
  });
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
  assertCommissionedLiveTrainingProductionNativeExecutionConfigurationV01(
    input.native_execution_configuration,
  );
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
    !commissionedLiveTrainingExternalExecutionExecutableBindingMatchesV01({
      native_execution_configuration: input.native_execution_configuration,
      codex_executable_fingerprint:
        input.owner.projection.codex_executable_fingerprint,
    }) ||
    input.owner.projection.compatible_codex_cli_version !==
      input.native_execution_configuration.expected_cli_version ||
    input.owner.projection.provider_ref.external_id !==
      input.native_execution_configuration.provider_id ||
    input.owner.projection.config_policy.provider_route_fingerprint !==
      input.codex_environment_binding.effective_provider_route_fingerprint
  )
    failV01("live_training_external_execution_authorization_binding_invalid");
  const material = buildAuthorizationMaterialV01({
    witness: input.witness,
    owner: input.owner,
    request: input.request,
    slot: input.slot,
    attempt_id: input.attempt_id,
    attempt_kind: input.attempt_kind,
    invocation_ordinal: input.invocation_ordinal,
    native_execution_configuration: input.native_execution_configuration,
    codex_environment_binding: input.codex_environment_binding,
    expires_at: input.expires_at,
    source,
  });
  const authorization = deepFreezeDataV01({
    ...material,
    integrity: integrityV01(material),
  }) as CommissionedLiveTrainingExternalExecutionAuthorizationV01;
  assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
    authorization,
  );
  SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.set(authorization, {
    source_class: "production",
    witness: input.witness,
    owner: input.owner,
    allocation: source,
    slot: structuredClone(input.slot),
    attempt_id: input.attempt_id,
    attempt_kind: input.attempt_kind,
    invocation_ordinal: input.invocation_ordinal,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    root_scope_fingerprint: material.root_scope_fingerprint,
    expected_material: canonicalizeProtocolValueV01(material),
    consumed: false,
  });
  return authorization;
}

/**
 * Contract-only fixture for proving exact WeakMap identity, clone refusal, and
 * replay refusal without manufacturing a production projection or live cohort
 * authorization. The production adapter consumer rejects this source class.
 */
export function createCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(input: {
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  invocation_ordinal: number;
}): CommissionedLiveTrainingExternalExecutionAuthorizationV01 {
  if (
    process.env.AUGNES_CANONICAL_TEST_MODE !== "1" ||
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1"
  )
    failV01("live_training_external_execution_authorization_contract_fixture_refused");
  const source = assertAllocationV01(input);
  if (
    ![
      "test_conformance",
      "future_live_control_flow_conformance",
    ].includes(source.authorization.authorization_kind) ||
    source.authorization.codex_environment_binding.binding_class !==
      "zero_provider_control_flow_conformance" ||
    input.owner.projection.executable_identity_class !== "test_emulated_profile"
  )
    failV01("live_training_external_execution_authorization_contract_fixture_refused");
  const material = buildAuthorizationMaterialV01({
    ...input,
    native_execution_configuration:
      source.authorization.native_execution_configuration,
    codex_environment_binding: source.authorization.codex_environment_binding,
    expires_at: source.authorization.expires_at,
    source,
  });
  const authorization = deepFreezeDataV01({
    ...material,
    integrity: integrityV01(material),
  }) as CommissionedLiveTrainingExternalExecutionAuthorizationV01;
  assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
    authorization,
  );
  SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.set(authorization, {
    source_class: "source_ownership_contract_test",
    witness: input.witness,
    owner: input.owner,
    allocation: source,
    slot: structuredClone(input.slot),
    attempt_id: input.attempt_id,
    attempt_kind: input.attempt_kind,
    invocation_ordinal: input.invocation_ordinal,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    root_scope_fingerprint: material.root_scope_fingerprint,
    expected_material: canonicalizeProtocolValueV01(material),
    consumed: false,
  });
  return authorization;
}

function buildAuthorizationMaterialV01(input: {
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
  source: RuntimeWitnessSourceV01;
}) {
  const modelConfigurationFingerprint = modelConfigurationFingerprintV01({
    model_id: input.native_execution_configuration.model_id,
    reasoning_effort: input.native_execution_configuration.reasoning_effort,
    effective_route_fingerprint:
      input.codex_environment_binding.effective_provider_route_fingerprint,
  });
  return {
    authorization_version:
      COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01,
    authorization_kind: "production_external_execution" as const,
    external_authorization_ref: externalAuthorizationRefV01({
      authorization_id: `${input.attempt_id}-${input.invocation_ordinal}`,
      observed_at: input.source.consumption.consumed_at,
      test_only: false,
    }),
    cohort_authorization_ref: commissionedLiveTrainingRecordRefV01(
      input.source.authorization,
    ),
    authorization_consumption_ref: createCommissionedLiveTrainingRecordRefV01({
      record_version: input.source.consumption.consumption_version,
      record_id: input.source.consumption.consumption_id,
      record_fingerprint: input.source.consumption.integrity.fingerprint,
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
      input.source.consumption.consumed_at,
    ),
    effective_route_fingerprint:
      input.codex_environment_binding.effective_provider_route_fingerprint,
    invocation_ordinal: input.invocation_ordinal,
    provider_model_bearing_invocation_ceiling: 1 as const,
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

export interface CommissionedLiveTrainingExternalExecutionAuthorizationAdapterObservationV01 {
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request_id: string;
  run_id: string;
  root_scope_fingerprint: string;
  projection_fingerprint: string;
  execution_environment_fingerprint: string;
  provider_ref: ExternalRefV01;
  model_configuration_fingerprint: string;
  effective_route_fingerprint: string;
  observed_model_id: string | null;
  observed_reasoning_effort: string | null;
  observed_at: string;
}

export function assertCommissionedLiveTrainingExternalExecutionAuthorizationSourceOwnedV01(
  authorization: CodexIsolatedAuthProductionExecutionAuthorizationV01,
): void {
  const source = SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.get(authorization);
  if (!source || source.source_class !== "production")
    failV01("live_training_external_execution_authorization_source_identity_missing");
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01(
    source.witness,
  );
}

export function consumeCommissionedLiveTrainingExternalExecutionAuthorizationForAdapterV01(
  authorization: CodexIsolatedAuthProductionExecutionAuthorizationV01,
  input: CommissionedLiveTrainingExternalExecutionAuthorizationAdapterObservationV01,
): void {
  const source = SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.get(authorization);
  if (
    source?.source_class === "source_ownership_contract_test" &&
    process.env.AUGNES_CANONICAL_TEST_MODE === "1" &&
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE === "1"
  ) {
    consumeRegisteredAuthorizationV01(
      authorization,
      input,
      "source_ownership_contract_test",
    );
    return;
  }
  consumeRegisteredAuthorizationV01(
    authorization,
    input,
    "production",
  );
}

function consumeRegisteredAuthorizationV01(
  authorization: CodexIsolatedAuthProductionExecutionAuthorizationV01,
  input: CommissionedLiveTrainingExternalExecutionAuthorizationAdapterObservationV01,
  expectedSourceClass: ProductionAuthorizationSourceV01["source_class"],
): void {
  const source = SOURCE_OWNED_PRODUCTION_AUTHORIZATIONS_V01.get(authorization);
  if (!source || source.source_class !== expectedSourceClass)
    failV01("live_training_external_execution_authorization_source_identity_missing");
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01(
    source.witness,
  );
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(input.owner);
  assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
    authorization,
  );
  const exact = authorization as CommissionedLiveTrainingExternalExecutionAuthorizationV01;
  const allocation = source.allocation;
  const nativeConfiguration = allocation.authorization.native_execution_configuration;
  const environment = allocation.authorization.codex_environment_binding;
  const expectedCohortAuthorizationRef = commissionedLiveTrainingRecordRefV01(
    allocation.authorization,
  );
  const expectedConsumptionRef = createCommissionedLiveTrainingRecordRefV01({
    record_version: allocation.consumption.consumption_version,
    record_id: allocation.consumption.consumption_id,
    record_fingerprint: allocation.consumption.integrity.fingerprint,
  });
  const expectedModelConfigurationFingerprint =
    modelConfigurationFingerprintV01({
      model_id: nativeConfiguration.model_id,
      reasoning_effort: nativeConfiguration.reasoning_effort,
      effective_route_fingerprint:
        environment.effective_provider_route_fingerprint,
    });
  const expectedExternalAuthorizationRef = externalAuthorizationRefV01({
    authorization_id: `${source.attempt_id}-${source.invocation_ordinal}`,
    observed_at: allocation.consumption.consumed_at,
    test_only: false,
  });
  const expectedModelConfigurationRef = modelConfigurationRefV01(
    expectedModelConfigurationFingerprint,
    allocation.consumption.consumed_at,
  );
  const { integrity, ...material } = exact;
  const productionSource = source.source_class === "production";
  if (productionSource) {
    assertCommissionedLiveTrainingProductionNativeExecutionConfigurationV01(
      nativeConfiguration,
    );
  }
  if (
    source.consumed ||
    (productionSource &&
      (allocation.authorization.authorization_kind !== "future_live_execution" ||
        environment.binding_class !== "isolated_authenticated_live_execution" ||
        source.owner.projection.executable_identity_class !==
          "production_pinned_codex")) ||
    (!productionSource &&
      (![
        "test_conformance",
        "future_live_control_flow_conformance",
      ].includes(allocation.authorization.authorization_kind) ||
        environment.binding_class !== "zero_provider_control_flow_conformance" ||
        source.owner.projection.executable_identity_class !==
          "test_emulated_profile")) ||
    exact.authorization_version !==
      COMMISSIONED_LIVE_TRAINING_EXTERNAL_EXECUTION_AUTHORIZATION_VERSION_V01 ||
    exact.authorization_kind !== "production_external_execution" ||
    integrity.algorithm !== "sha256" ||
    integrity.fingerprint !== integrityV01(material).fingerprint ||
    source.expected_material !== canonicalizeProtocolValueV01(material) ||
    source.owner !== input.owner ||
    canonicalizeProtocolValueV01(exact.cohort_authorization_ref) !==
      canonicalizeProtocolValueV01(expectedCohortAuthorizationRef) ||
    canonicalizeProtocolValueV01(exact.authorization_consumption_ref) !==
      canonicalizeProtocolValueV01(expectedConsumptionRef) ||
    exact.runtime_consumption_witness_fingerprint !==
      source.witness.witness_identity_fingerprint ||
    exact.slot_id !== source.slot.slot_id ||
    canonicalizeProtocolValueV01(source.slot) !==
      canonicalizeProtocolValueV01(
        allocation.plan.slots.find((slot) => slot.slot_id === source.slot.slot_id),
      ) ||
    exact.attempt_id !== source.attempt_id ||
    exact.attempt_kind !== source.attempt_kind ||
    exact.request_id !== source.request_id ||
    exact.request_id !== input.request_id ||
    exact.run_id !== source.run_id ||
    exact.run_id !== input.run_id ||
    exact.root_scope_fingerprint !== source.root_scope_fingerprint ||
    exact.root_scope_fingerprint !== input.root_scope_fingerprint ||
    exact.projection_fingerprint !== source.owner.projection.integrity.fingerprint ||
    exact.projection_fingerprint !== input.projection_fingerprint ||
    exact.projection_fingerprint !==
      environment.codex_isolated_auth_projection_fingerprint ||
    exact.execution_environment_fingerprint !==
      source.owner.execution_environment_fingerprint ||
    exact.execution_environment_fingerprint !==
      input.execution_environment_fingerprint ||
    canonicalizeProtocolValueV01(exact.provider_ref) !==
      canonicalizeProtocolValueV01(source.owner.projection.provider_ref) ||
    canonicalizeProtocolValueV01(exact.provider_ref) !==
      canonicalizeProtocolValueV01(input.provider_ref) ||
    canonicalizeProtocolValueV01(exact.external_authorization_ref) !==
      canonicalizeProtocolValueV01(expectedExternalAuthorizationRef) ||
    canonicalizeProtocolValueV01(exact.model_configuration_ref) !==
      canonicalizeProtocolValueV01(expectedModelConfigurationRef) ||
    exact.model_configuration_ref.external_id !==
      `codex-isolated-auth-model-configuration:${input.model_configuration_fingerprint}` ||
    input.model_configuration_fingerprint !==
      expectedModelConfigurationFingerprint ||
    exact.effective_route_fingerprint !==
      environment.effective_provider_route_fingerprint ||
    exact.effective_route_fingerprint !== input.effective_route_fingerprint ||
    exact.expected_provider_id !== nativeConfiguration.provider_id ||
    (productionSource &&
      exact.expected_provider_id !==
        source.owner.projection.provider_ref.external_id) ||
    exact.expected_model_id !== nativeConfiguration.model_id ||
    exact.expected_model_id !== input.observed_model_id ||
    exact.expected_route_id !== nativeConfiguration.route_id ||
    exact.expected_reasoning_effort !== nativeConfiguration.reasoning_effort ||
    exact.expected_reasoning_effort !== input.observed_reasoning_effort ||
    (productionSource &&
      !commissionedLiveTrainingExternalExecutionExecutableBindingMatchesV01({
        native_execution_configuration: nativeConfiguration,
        codex_executable_fingerprint:
          source.owner.projection.codex_executable_fingerprint,
      })) ||
    exact.native_execution_configuration_fingerprint !==
      nativeConfiguration.configuration_fingerprint ||
    exact.native_execution_configuration_fingerprint !==
      source.witness.native_execution_configuration_fingerprint ||
    exact.invocation_ordinal !== source.invocation_ordinal ||
    (productionSource &&
      exact.invocation_ordinal >
        allocation.authorization.provider_bearing_native_host_invocation_limit) ||
    (productionSource &&
      exact.invocation_ordinal >
        allocation.authorization.model_bearing_native_host_invocation_limit) ||
    exact.invocation_ordinal > source.witness.cohort_native_invocation_ceiling ||
    exact.provider_model_bearing_invocation_ceiling !== 1 ||
    exact.expires_at !== allocation.authorization.expires_at ||
    !strictIsoV01(exact.expires_at) ||
    !strictIsoV01(input.observed_at) ||
    Date.parse(exact.expires_at) <= Date.parse(input.observed_at) ||
    exact.no_fallback !== true ||
    exact.single_use !== true ||
    exact.test_only !== false
  )
    failV01("live_training_external_execution_authorization_consumption_refused");
  source.consumed = true;
}

export function assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
  value: unknown,
): asserts value is CommissionedLiveTrainingExternalExecutionAuthorizationV01 {
  if (!plainObjectV01(value))
    failV01("live_training_external_execution_authorization_public_shape_invalid");
  assertExactKeysV01(value, [
    "authorization_version",
    "authorization_kind",
    "external_authorization_ref",
    "cohort_authorization_ref",
    "authorization_consumption_ref",
    "runtime_consumption_witness_fingerprint",
    "slot_id",
    "attempt_id",
    "attempt_kind",
    "request_id",
    "run_id",
    "root_scope_fingerprint",
    "projection_fingerprint",
    "execution_environment_fingerprint",
    "provider_ref",
    "model_configuration_ref",
    "effective_route_fingerprint",
    "invocation_ordinal",
    "provider_model_bearing_invocation_ceiling",
    "native_execution_configuration_fingerprint",
    "expected_provider_id",
    "expected_model_id",
    "expected_route_id",
    "expected_reasoning_effort",
    "expires_at",
    "no_fallback",
    "single_use",
    "test_only",
    "integrity",
  ]);
  if (containsExecutableValueV01(value))
    failV01("live_training_external_execution_authorization_public_shape_invalid");
  const { integrity, ...material } = value;
  if (
    !plainObjectV01(integrity) ||
    canonicalizeProtocolValueV01(Object.keys(integrity).sort()) !==
      canonicalizeProtocolValueV01(["algorithm", "fingerprint"]) ||
    integrity.algorithm !== "sha256" ||
    integrity.fingerprint !== integrityV01(material).fingerprint
  )
    failV01("live_training_external_execution_authorization_integrity_invalid");
  assertSafeCommissionedLiveTrainingOutputV01(value);
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

function modelConfigurationFingerprintV01(input: {
  model_id: string;
  reasoning_effort: string;
  effective_route_fingerprint: string;
}): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      configuration_version:
        CODEX_ISOLATED_AUTH_PRODUCTION_MODEL_CONFIGURATION_VERSION_V01,
      model: input.model_id,
      reasoning_effort: input.reasoning_effort,
      provider_route_fingerprint: input.effective_route_fingerprint,
    }),
  );
}

function plainObjectV01(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
      canonicalizeProtocolValueV01([...expected].sort())
  )
    failV01("live_training_external_execution_authorization_public_shape_invalid");
}

function containsExecutableValueV01(
  value: unknown,
  seen = new Set<object>(),
): boolean {
  if (typeof value === "function") return true;
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value)) return true;
  seen.add(value);
  const containsExecutable = Object.values(value).some((candidate) =>
    containsExecutableValueV01(candidate, seen),
  );
  seen.delete(value);
  return containsExecutable;
}

function strictIsoV01(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) &&
    Number.isFinite(Date.parse(value));
}

function deepFreezeDataV01<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((candidate) => deepFreezeDataV01(candidate));
    Object.freeze(value);
  }
  return value;
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
