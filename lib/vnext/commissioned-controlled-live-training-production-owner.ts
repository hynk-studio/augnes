import {
  createCodexAuthFileBrokerBindingV01,
  createCodexAuthFileBrokerV01,
  credentialBrokerBindingFingerprintV01,
  type CodexCredentialBrokerBindingV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  createCodexIsolatedAuthProvisioningBindingV01,
  provisionCodexIsolatedAuthProjectionV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  assertCommissionedLiveTrainingProductionNativeExecutionConfigurationV01,
  commissionedLiveTrainingExecutableIdentityMatchesRawFileFingerprintV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import {
  observeCommissionedLiveTrainingExecutableIdentityV01,
} from "@/lib/vnext/commissioned-controlled-live-training-runner";
import type {
  CommissionedLiveTrainingAuthorizationV01,
  CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
} from "@/types/vnext/commissioned-controlled-live-training";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 } from "@/types/vnext/codex-isolated-auth-projection";

export const COMMISSIONED_LIVE_TRAINING_PRODUCTION_RUNTIME_AUTH_BINDING_VERSION_V01 =
  "commissioned_live_training_production_runtime_auth_binding.v0.1" as const;

/**
 * Safe operator material carried only by the executing process. Credential
 * contents and the private source path remain outside this public binding.
 */
export interface CommissionedLiveTrainingProductionRuntimeAuthBindingV01 {
  binding_version: typeof COMMISSIONED_LIVE_TRAINING_PRODUCTION_RUNTIME_AUTH_BINDING_VERSION_V01;
  projection_id: string;
  provisioning_binding_id: string;
  provisioning_binding_ref: ExternalRefV01;
  provider_ref: ExternalRefV01;
  codex_executable_ref: ExternalRefV01;
  broker_binding: CodexCredentialBrokerBindingV01;
  projection_issued_at: string;
  projection_expires_at: string;
}

export function commissionedLiveTrainingProductionOwnerExecutableBindingMatchesV01(
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

export function parseCommissionedLiveTrainingProductionRuntimeAuthBindingV01(
  value: unknown,
): CommissionedLiveTrainingProductionRuntimeAuthBindingV01 {
  if (!plainObjectV01(value)) failV01("live_training_runtime_auth_binding_invalid");
  assertExactKeysV01(value, [
    "binding_version",
    "projection_id",
    "provisioning_binding_id",
    "provisioning_binding_ref",
    "provider_ref",
    "codex_executable_ref",
    "broker_binding",
    "projection_issued_at",
    "projection_expires_at",
  ]);
  if (!plainObjectV01(value.broker_binding))
    failV01("live_training_runtime_auth_binding_invalid");
  assertExactKeysV01(value.broker_binding, [
    "auth_handle_ref",
    "broker_backend_ref",
    "broker_executable_ref",
    "broker_executable_fingerprint",
    "broker_locator_fingerprint",
  ]);
  if (
    value.binding_version !==
      COMMISSIONED_LIVE_TRAINING_PRODUCTION_RUNTIME_AUTH_BINDING_VERSION_V01 ||
    !safeIdV01(value.projection_id) ||
    !safeIdV01(value.provisioning_binding_id) ||
    !strictIsoV01(value.projection_issued_at) ||
    !strictIsoV01(value.projection_expires_at) ||
    Date.parse(value.projection_expires_at) <=
      Date.parse(value.projection_issued_at) ||
    !safeExternalRefV01(value.provisioning_binding_ref) ||
    !safeExternalRefV01(value.provider_ref) ||
    !safeExternalRefV01(value.codex_executable_ref) ||
    !safeExternalRefV01(value.broker_binding.auth_handle_ref) ||
    !safeExternalRefV01(value.broker_binding.broker_backend_ref) ||
    !safeExternalRefV01(value.broker_binding.broker_executable_ref) ||
    !sha256V01(value.broker_binding.broker_executable_fingerprint) ||
    !sha256V01(value.broker_binding.broker_locator_fingerprint) ||
    value.provider_ref.ref_type !== "model_provider" ||
    value.provider_ref.external_id !== "openai"
  )
    failV01("live_training_runtime_auth_binding_invalid");
  return Object.freeze(structuredClone(
    value as unknown as CommissionedLiveTrainingProductionRuntimeAuthBindingV01,
  ));
}

export function createCommissionedLiveTrainingProductionOwnerFactoryV01(input: {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  runtime_auth_binding: CommissionedLiveTrainingProductionRuntimeAuthBindingV01;
  executable_path: string;
  source_codex_home: string;
}) {
  assertCommissionedLiveTrainingProductionNativeExecutionConfigurationV01(
    input.native_execution_configuration,
  );
  const binding = parseCommissionedLiveTrainingProductionRuntimeAuthBindingV01(
    input.runtime_auth_binding,
  );
  const observedRuntimeIdentity =
    observeCommissionedLiveTrainingExecutableIdentityV01({
      executable_path: process.execPath,
      executable_kind: "node_runtime",
    });
  const expectedBrokerBinding = createCodexAuthFileBrokerBindingV01({
    source_codex_home: input.source_codex_home,
    broker_executable_path: process.execPath,
  });
  const environment = input.authorization.codex_environment_binding;
  if (
    input.authorization.authorization_kind !== "future_live_execution" ||
    canonicalizeProtocolValueV01(
      input.authorization.native_execution_configuration,
    ) !== canonicalizeProtocolValueV01(input.native_execution_configuration) ||
    environment.binding_class !== "isolated_authenticated_live_execution" ||
    environment.executable_identity_class !== "production_pinned_codex" ||
    !commissionedLiveTrainingProductionOwnerExecutableBindingMatchesV01({
      native_execution_configuration: input.native_execution_configuration,
      codex_executable_fingerprint:
        environment.codex_executable_fingerprint,
    }) ||
    input.native_execution_configuration.expected_cli_version !==
      CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 ||
    input.native_execution_configuration.provider_id !== "openai" ||
    !privateAbsolutePathV01(input.source_codex_home) ||
    canonicalizeProtocolValueV01(observedRuntimeIdentity) !==
      canonicalizeProtocolValueV01(
        input.native_execution_configuration.runtime_executable_identity,
      ) ||
    canonicalizeProtocolValueV01(expectedBrokerBinding) !==
      canonicalizeProtocolValueV01(binding.broker_binding)
  )
    failV01("live_training_production_owner_factory_binding_invalid");
  const broker = createCodexAuthFileBrokerV01({
    binding: binding.broker_binding,
    source_codex_home: input.source_codex_home,
    broker_executable_path: process.execPath,
  });
  const provisioningBinding = createCodexIsolatedAuthProvisioningBindingV01({
    binding_id: binding.provisioning_binding_id,
    auth_handle_ref: binding.broker_binding.auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(
      binding.broker_binding,
    ),
    provider_ref: binding.provider_ref,
    codex_executable_fingerprint: environment.codex_executable_fingerprint,
    executable_identity_class: "production_pinned_codex",
    compatible_codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: binding.projection_issued_at,
    expires_at: binding.projection_expires_at,
  });
  let provisionedPromise: ReturnType<
    typeof provisionCodexIsolatedAuthProjectionV01
  > | null = null;
  return async (ownerInput: {
    attempt_id: string;
    repository_root: string;
    state_parent: string;
    test_environment: Record<string, string | undefined>;
  }): Promise<CodexIsolatedAuthenticatedExecutionOwnerV01> => {
    if (
      Object.keys(ownerInput.test_environment).length !== 0 ||
      process.env.AUGNES_CANONICAL_TEST_MODE === "1" ||
      process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE === "1"
    )
      failV01("live_training_production_owner_test_controls_refused");
    void ownerInput.attempt_id;
    provisionedPromise ??= provisionCodexIsolatedAuthProjectionV01({
      projection_id: binding.projection_id,
      provisioning_binding: provisioningBinding,
      provisioning_binding_ref: binding.provisioning_binding_ref,
      provider_ref: binding.provider_ref,
      broker_binding: binding.broker_binding,
      broker,
      codex_executable_ref: binding.codex_executable_ref,
      codex_executable_fingerprint: environment.codex_executable_fingerprint,
      executable_identity_class: "production_pinned_codex",
      compatible_codex_cli_version:
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      issued_at: binding.projection_issued_at,
      expires_at: binding.projection_expires_at,
    });
    const provisioned = await provisionedPromise;
    const projection = provisioned.projection;
    if (
      projection.integrity.fingerprint !==
        environment.codex_isolated_auth_projection_fingerprint ||
      projection.semantic_profile_fingerprint !==
        environment.semantic_profile_fingerprint ||
      projection.account_identity_fingerprint !==
        environment.account_identity_fingerprint ||
      projection.auth_source_generation_fingerprint !==
        environment.auth_source_generation_fingerprint ||
      projection.broker_locator_fingerprint !==
        environment.broker_locator_fingerprint ||
      createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          broker_version: projection.broker_version,
          broker_backend_ref: projection.broker_backend_ref,
          broker_executable_ref: projection.broker_executable_ref,
          broker_executable_fingerprint:
            projection.broker_executable_fingerprint,
          broker_locator_fingerprint: projection.broker_locator_fingerprint,
        }),
      ) !== environment.broker_binding_fingerprint ||
      projection.auth_mode !== environment.auth_mode ||
      projection.codex_executable_fingerprint !==
        environment.codex_executable_fingerprint ||
      projection.compatible_codex_cli_version !==
        environment.compatible_codex_cli_version ||
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(projection.state_policy),
      ) !== environment.state_policy_fingerprint ||
      projection.config_policy.policy_fingerprint !==
        environment.config_tool_policy_fingerprint ||
      projection.config_policy.provider_route_fingerprint !==
        environment.effective_provider_route_fingerprint ||
      projection.app_server_launch_shape_fingerprint !==
        environment.app_server_launch_shape_fingerprint ||
      projection.allowed_child_environment_key_fingerprint !==
        environment.allowed_child_environment_fingerprint ||
      projection.task_tool_network_authority !== "none" ||
      projection.cleanup_policy !== environment.cleanup_policy
    )
      failV01("live_training_production_projection_reprovision_mismatch");
    return new CodexIsolatedAuthenticatedExecutionOwnerV01({
      projection,
      credential_attestation: provisioned.credential_attestation,
      projection_seal: provisioned.projection_seal,
      broker,
      state_parent: ownerInput.state_parent,
      repository_root: ownerInput.repository_root,
      command: input.executable_path,
      base_environment: {
        NODE_ENV: "production",
        PATH: process.env.PATH,
        LANG: "C",
        TZ: "UTC",
        NO_COLOR: "1",
      },
    });
  };
}

function assertExactKeysV01(value: Record<string, unknown>, keys: string[]): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...keys].sort())
  )
    failV01("live_training_runtime_auth_binding_invalid");
}

function plainObjectV01(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

function safeExternalRefV01(value: unknown): value is ExternalRefV01 {
  if (!plainObjectV01(value)) return false;
  const allowed = new Set([
    "ref_version",
    "ref_type",
    "external_id",
    "provider",
    "host",
    "observed_at",
    "source_ref",
    "compatibility_namespace",
    "trust_class",
  ]);
  if (
    !Object.keys(value).every((key) => allowed.has(key)) ||
    (value.source_ref !== undefined && value.source_ref !== null)
  )
    return false;
  return value.ref_version === "external_ref.v0.1" &&
    safeIdV01(value.ref_type) &&
    safeIdV01(value.external_id) &&
    (value.provider === undefined || value.provider === null ||
      safeIdV01(value.provider)) &&
    (value.host === undefined || value.host === null || safeIdV01(value.host)) &&
    (value.observed_at === undefined || value.observed_at === null ||
      strictIsoV01(value.observed_at)) &&
    (value.compatibility_namespace === undefined ||
      value.compatibility_namespace === null ||
      safeIdV01(value.compatibility_namespace)) &&
    [
      "direct_local_observation",
      "verified_external_observation",
      "host_attestation",
      "provider_report",
      "user_declaration",
      "imported_unverified",
      "derived_interpretation",
    ].includes(String(value.trust_class));
}

function safeIdV01(value: unknown): value is string {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/u.test(value) &&
    !value.includes("..") &&
    !value.startsWith("/");
}

function sha256V01(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);
}

function strictIsoV01(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) &&
    Number.isFinite(Date.parse(value));
}

function privateLocatorV01(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1_024 &&
    !/[\r\n\0]/u.test(value);
}

function privateAbsolutePathV01(value: unknown): value is string {
  return privateLocatorV01(value) && value.startsWith("/");
}

function failV01(code: string): never {
  throw new Error(code);
}
