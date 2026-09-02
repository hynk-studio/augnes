import assert from "node:assert/strict";
import { ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  CodexAppServerUserAgentErrorV01,
  CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
  CODEX_APP_SERVER_USER_AGENT_MAX_LENGTH_V01,
  observeCodexAppServerUserAgentV01,
} from "@/lib/vnext/native-host/codex-app-server-user-agent";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import {
  CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01,
  CodexCredentialBrokerErrorV01,
  bindCodexBrokerPrivateLaunchCapabilityV01,
  codexAuthFilePlatformPolicyContractForTestV01,
  configureCodexAuthenticatedChildBindingFaultForTestV01,
  codexAuthKeyringAccountForHomeV01,
  createCodexAuthFileBrokerBindingV01,
  createCodexAuthFileBrokerForTestV01,
  createFakeCodexCredentialBrokerV01,
  createMacOsKeychainCodexAuthBrokerV01,
  credentialBrokerBindingFingerprintV01,
  fingerprintCodexAuthFileLocatorV01,
  fingerprintBrokerLocatorV01,
  macOsKeychainReadTimeoutContractForTestV01,
  observeMacOsKeychainReadForTestV01,
  spawnCodexAppServerWithPrivateCapabilityV01,
  verifyCodexBrokerProcessIdentitySubstitutionForTestV01,
  type CodexAuthenticatedChildBindingFaultForTestV01,
  type CodexIsolatedAuthenticatedChildBindingV01,
  type CodexCredentialBrokerBindingV01,
  type CodexCredentialBrokerV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  CodexIsolatedAuthProjectionErrorV01,
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  CODEX_0_152_1_QUALIFICATION_SEMANTIC_PROFILE_V01,
  CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01,
  CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01,
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  assertValidCodexIsolatedAuthObservationV01,
  assertValidCodexIsolatedAuthProjectionV01,
  codexIsolatedAuthExpectedRuntimeOriginPathsV01,
  codexIsolatedAuthExpectedRuntimeOverridePathsV01,
  createCodexIsolatedAuthProvisioningBindingV01,
  createCodexIsolatedAuthTestRefV01,
  provisionCodexIsolatedAuthProjectionV01,
  type ProvisionCodexIsolatedAuthProjectionResultV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  consumeCodexAuthenticatedChildBindingIntoPreflightV01,
  createCodexAppServerAdapterV01,
  createCodexIsolatedAuthTestExecutionAuthorizationV01,
  probeCodexIsolatedAuthCredentialFreeCompatibilityV01,
  qualifyCodex01521ExactCompatibilityV01,
  type CodexAppServerAdapterObservationV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type {
  CodexIsolatedAuthCredentialFreePreflightV01,
  CodexIsolatedAuthObservationV01,
  CodexIsolatedAuthProjectionV01,
  CodexIsolatedAuthTestExecutionAuthorizationV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import {
  CODEX_0_152_1_RELEASE_ARCHIVE_FINGERPRINT_V01,
  CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01,
  CODEX_0_152_1_UPSTREAM_TAG_V01,
  CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01,
  CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
  CODEX_AUTH_KEYRING_SERVICE_V01,
  CODEX_APP_SERVER_CLIENT_VERSION_V01,
  CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01,
  CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01,
  CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
} from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostLifecycleEventV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const GENERATED_AT = "2026-08-28T00:00:00.000Z";
const EXPIRES_AT = "2099-08-29T06:00:00.000Z";
const RAW_ACCOUNT_ID = "acct-fixture-stable-private";
const RAW_USER_ID = "user-fixture-stable-private";
const OTHER_ACCOUNT_ID = "acct-fixture-other-private";
const OTHER_USER_ID = "user-fixture-other-private";
const AGENT_PRIVATE_KEY = Buffer.from(
  "fixture-agent-private-key-material-never-public",
  "utf8",
).toString("base64");
const BASE_CLAIMS = {
  iss: "https://chatgpt.com/codex-backend/agent-identity",
  aud: "codex-app-server",
  iat: 1_777_000_000,
  exp: 4_102_444_800,
  agent_runtime_id: "fixture-agent-runtime",
  agent_private_key: AGENT_PRIVATE_KEY,
  plan_type: "unknown",
  chatgpt_account_is_fedramp: false,
} as const;
const FAKE_JWT = jwtV01(
  {
    ...BASE_CLAIMS,
    account_id: RAW_ACCOUNT_ID,
    chatgpt_user_id: RAW_USER_ID,
    email: "not-returned-to-augnes@example.invalid",
  },
  "fixture-signature-material-not-a-real-token",
);
const OTHER_ACCOUNT_JWT = jwtV01(
  {
    ...BASE_CLAIMS,
    account_id: OTHER_ACCOUNT_ID,
    chatgpt_user_id: OTHER_USER_ID,
  },
  "other-signature-material-not-a-real-token",
);
const POISON_FAILURE_JWT = jwtV01(
  {
    ...BASE_CLAIMS,
    agent_runtime_id: "fixture-agent-runtime-poison-failure",
    account_id: RAW_ACCOUNT_ID,
    chatgpt_user_id: RAW_USER_ID,
  },
  "poison-failure-signature-material",
);
const CHANGED_ACCOUNT_ID_JWT = jwtV01(
  {
    ...BASE_CLAIMS,
    account_id: OTHER_ACCOUNT_ID,
    chatgpt_user_id: RAW_USER_ID,
  },
  "changed-account-id-signature",
);
const CHANGED_USER_ID_JWT = jwtV01(
  {
    ...BASE_CLAIMS,
    account_id: RAW_ACCOUNT_ID,
    chatgpt_user_id: OTHER_USER_ID,
  },
  "changed-user-id-signature",
);
const PARTIAL_ID_JWT = jwtV01(
  { ...BASE_CLAIMS, account_id: RAW_ACCOUNT_ID },
  "partial-signature-material",
);
const SECRET_CANARIES = [
  FAKE_JWT,
  OTHER_ACCOUNT_JWT,
  POISON_FAILURE_JWT,
  CHANGED_ACCOUNT_ID_JWT,
  CHANGED_USER_ID_JWT,
  ["sk", "proj-AbCdEfGh12345678"].join("-"),
  ["xoxb", "AbCdEfGh12345678"].join("-"),
  ["AKIA", "ABCDEFGHIJKLMNOP"].join(""),
  ["-----BEGIN", "PRIVATE KEY-----"].join(" "),
  ["ghp", "AbCdEfGhIjKlMnOpQrStUvWxYz012345"].join("_"),
  AGENT_PRIVATE_KEY,
  BASE_CLAIMS.agent_runtime_id,
  "fixture-agent-task",
  "fixture-refresh-token",
  RAW_ACCOUNT_ID,
  RAW_USER_ID,
  "not-returned-to-augnes@example.invalid",
  "different-account@example.invalid",
  OTHER_ACCOUNT_ID,
  OTHER_USER_ID,
  AGENT_PRIVATE_KEY,
] as const;

type RootsV01 = ReturnType<typeof createRootsV01>;
type FocusedModeV01 = "contracts" | "rollback-lifecycle";
type ExecutionAuthorizationVariantV01 =
  | "test_authorized"
  | "absent"
  | "wrong_request"
  | "wrong_run"
  | "cloned"
  | "expired"
  | "substituted_root"
  | "substituted_projection"
  | "substituted_environment"
  | "substituted_provider"
  | "substituted_route"
  | "substituted_model"
  | "substituted_ordinal"
  | "substituted_ceiling"
  | "substituted_fallback"
  | "unsupported_production";
type PresentedExternalExecutionAuthorizationV01 =
  | CodexIsolatedAuthTestExecutionAuthorizationV01
  | Readonly<Record<string, unknown>>;
type ProbeV01 = {
  result: NativeHostResultV01 | null;
  error: unknown;
  settled_error: unknown;
  lifecycle_events: NativeHostLifecycleEventV01[];
  adapter_observations: CodexAppServerAdapterObservationV01[];
  auth_observations: CodexIsolatedAuthObservationV01[];
  state_parent: string;
  boundary_path: string;
  network_path: string;
  cleanup_path: string;
  trace_path: string;
  execution_authorization: PresentedExternalExecutionAuthorizationV01 | null;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
};

async function mainV01(): Promise<void> {
  for (const mode of focusedModesV01(process.argv.slice(2)))
    await runFocusedModeV01(mode);
}

function focusedModesV01(args: string[]): FocusedModeV01[] {
  if (args.length === 0) return ["contracts", "rollback-lifecycle"];
  if (args.length === 1 && args[0] === "--contracts") return ["contracts"];
  if (args.length === 1 && args[0] === "--rollback-lifecycle")
    return ["rollback-lifecycle"];
  throw new Error("codex_isolated_auth_test_mode_invalid");
}

async function runFocusedModeV01(mode: FocusedModeV01): Promise<void> {
  const prior = {
    test: process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE,
    home: process.env.HOME,
    codex: process.env.CODEX_HOME,
    sqlite: process.env.CODEX_SQLITE_HOME,
    tmp: process.env.TMPDIR,
  };
  const roots = createRootsV01();
  const networkGuard = installZeroNetworkGuard();
  try {
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = "1";
    process.env.HOME = roots.ordinaryHome;
    process.env.CODEX_HOME = roots.ordinaryHome;
    process.env.CODEX_SQLITE_HOME = roots.ordinaryHome;
    process.env.TMPDIR = roots.ordinaryTmp;
    if (mode === "contracts") await contractsV01(roots);
    else await rollbackLifecycleV01(roots);
    assert.deepEqual(
      networkGuard.attempts,
      [],
      `${mode} must make zero external network attempts`,
    );
  } finally {
    networkGuard.restore();
    restoreEnvV01("AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE", prior.test);
    restoreEnvV01("HOME", prior.home);
    restoreEnvV01("CODEX_HOME", prior.codex);
    restoreEnvV01("CODEX_SQLITE_HOME", prior.sqlite);
    restoreEnvV01("TMPDIR", prior.tmp);
    rmSync(roots.root, { recursive: true, force: true });
  }
}

async function contractsV01(roots: RootsV01): Promise<void> {
    const userAgentProof = userAgentContractV01();
    await macOsKeychainReadTimeoutV01(roots);
    await officialAuthStorageAlignmentV01(roots);
    await fileBackedAuthSourceV01(roots);
    const provisioned = await provisionV01(roots, "primary", FAKE_JWT);
    assert.equal(provisioned.availability.state, "available_exact");
    assert.match(
      provisioned.credential_attestation.account_identity_fingerprint,
      /^sha256:/u,
    );
    assert.equal(
      provisioned.credential_attestation.claims_authentication_status,
      "stored_agent_identity_unverified_before_codex_auth",
    );
    assertPublicSafeV01(provisioned);
    assertNoSecretApiV01(provisioned);
    const maliciousConsumerBroker = brokerV01(roots, FAKE_JWT);
    assertNoSecretApiV01(maliciousConsumerBroker);
    assert.equal(
      Reflect.get(maliciousConsumerBroker, "spawnExactCodexAppServerV01"),
      undefined,
      "the public broker must expose no authenticated spawn operation",
    );
    assertRuntimeSubstitutionRefusedV01(
      maliciousConsumerBroker,
      "spawnExactCodexAppServerV01",
    );
    const maliciousStateParent = path.join(
      roots.state,
      "malicious-consumer-surface",
    );
    const maliciousTracePath = path.join(
      roots.runtime,
      "malicious-consumer-surface.trace.jsonl",
    );
    const maliciousOwnerInput = ownerInputV01(
      roots,
      "malicious-consumer-surface",
      provisioned,
      FAKE_JWT,
      "isolated_auth_success",
      maliciousStateParent,
    );
    maliciousOwnerInput.test_environment = {
      ...maliciousOwnerInput.test_environment,
      FAKE_CODEX_TRACE_PATH: maliciousTracePath,
    };
    const maliciousConsumerOwner =
      new CodexIsolatedAuthenticatedExecutionOwnerV01(maliciousOwnerInput);
    assertPublicSafeV01(maliciousConsumerOwner);
    assertNoSecretApiV01(maliciousConsumerOwner);
    assertSourceOwnedCodexIsolatedExecutionOwnerV01(maliciousConsumerOwner);
    class MaliciousDerivedExecutionOwnerV01 extends
      CodexIsolatedAuthenticatedExecutionOwnerV01 {
      override assertRepositoryRootV01(_value: string): void {}
      override async startAuthenticatedPreflightV01(): Promise<never> {
        throw new Error("derived owner must never become source-owned");
      }
    }
    assert.throws(
      () =>
        new MaliciousDerivedExecutionOwnerV01(
          ownerInputV01(
            roots,
            "malicious-derived-owner",
            provisioned,
            FAKE_JWT,
            "isolated_auth_success",
          ),
        ),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_owner_subclass_refused",
    );
    assert.throws(
      () =>
        bindCodexBrokerPrivateLaunchCapabilityV01({
          owner: maliciousConsumerOwner,
          broker: maliciousConsumerBroker,
          projection: provisioned.projection,
          credential_attestation: provisioned.credential_attestation,
          command: process.execPath,
          test_prefix_args: [
            path.join(
              process.cwd(),
              "scripts",
              "fixtures",
              "fake-codex-app-server.mjs",
            ),
          ],
          repository_root: roots.ordinaryHome,
          state_paths: {
            root: roots.ordinaryHome,
            HOME: roots.ordinaryHome,
            CODEX_HOME: roots.ordinaryHome,
            CODEX_SQLITE_HOME: roots.ordinaryHome,
            TMPDIR: roots.ordinaryTmp,
          },
          base_environment: { NODE_ENV: "test" },
          test_controls: {
            AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
          },
          launch_shape_fingerprint:
            provisioned.projection.app_server_launch_shape_fingerprint,
          args: ["--unsafe", "app-server", "--stdio"],
        } as unknown as Parameters<
          typeof bindCodexBrokerPrivateLaunchCapabilityV01
        >[0]),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code ===
          "codex_auth_broker_private_spawn_capability_refused",
    );
    await assert.rejects(
      () =>
        spawnCodexAppServerWithPrivateCapabilityV01(
          Object.freeze({
            capability_fingerprint: `sha256:${"0".repeat(64)}`,
          }),
        ),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code ===
          "codex_auth_broker_private_spawn_capability_refused",
    );
    assertRuntimeSubstitutionRefusedV01(
      maliciousConsumerOwner,
      "startAuthenticatedPreflightV01",
    );
    assert.equal(
      Reflect.get(maliciousConsumerOwner, "spawnIsolatedCodexAppServerV01"),
      undefined,
      "the public owner must expose no authenticated raw-child spawn",
    );
    assertNoExecutionTransportSurfaceV01(maliciousConsumerOwner);
    assert.throws(
      () => maliciousConsumerOwner.assertRepositoryRootV01(roots.ordinaryHome),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_repository_root_mismatch",
    );
    assert.throws(
      () =>
        assertSourceOwnedCodexIsolatedExecutionOwnerV01({
          projection: maliciousConsumerOwner.projection,
          startAuthenticatedPreflightV01: async () => {
            throw new Error("forged execution owner must remain unreachable");
          },
        } as unknown as CodexIsolatedAuthenticatedExecutionOwnerV01),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_owner_source_mismatch",
    );
    const maliciousPreflight =
      await maliciousConsumerOwner.startAuthenticatedPreflightV01();
    let maliciousPreflightCleaned = false;
    try {
      assertNoExecutionTransportSurfaceV01(maliciousPreflight);
      const initialized = await maliciousPreflight.initializeV01();
      const observed =
        await maliciousPreflight.observeAuthenticatedConfigurationV01({
          observed_at: GENERATED_AT,
        });
      assert.equal(
        initialized.cli_version,
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      );
      assert.equal(
        observed.observation.claims_authentication_status,
        "verified_by_codex_agent_identity_auth",
      );
      assert.match(observed.model_configuration_fingerprint, /^sha256:/u);
      assertPublicSafeV01(observed);
      const maliciousMethods = receivedMethodsV01(maliciousTracePath);
      assert.equal(maliciousMethods.includes("thread/start"), false);
      assert.equal(maliciousMethods.includes("turn/start"), false);
      assert.equal(
        maliciousMethods.some((method) =>
          ["thread/start", "turn/start", "turn/interrupt"].includes(method),
        ),
        false,
      );
      assert.equal(await maliciousPreflight.shutdownAndCleanupV01(), true);
      maliciousPreflightCleaned = true;
    } finally {
      if (!maliciousPreflightCleaned)
        await maliciousPreflight.shutdownAndCleanupV01().catch(() => false);
    }
    assert.equal(readdirSync(maliciousStateParent).length, 0);
    await assert.rejects(
      () => maliciousPreflight.initializeV01(),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_preflight_session_unavailable",
    );

    const provenanceProof = await authenticatedChildProvenanceV01(
      roots,
      provisioned,
    );

    const semanticProfileProof =
      await semanticProfileAndCredentialFreePreflightV01(roots, provisioned);
    const executionGateProof = await externalExecutionAuthorityGateV01(
      roots,
      provisioned,
    );

    const positive = await runProbeV01(
      roots,
      "positive",
      provisioned,
      FAKE_JWT,
      "isolated_auth_success",
    );
    assert.equal(positive.error, null);
    assert.equal(positive.settled_error, null);
    assert.equal(positive.result?.outcome, "completed");
    assert.equal(positive.auth_observations.length, 1);
    const observation = positive.auth_observations[0]!;
    assert.equal(
      observation.config_layers_fingerprint,
      "sha256:e940fef393c2d25e2279d5f09aa3ebcdde7e590acca60466c6db618598c2d531",
    );
    assert.equal(
      observation.account_identity_fingerprint,
      provisioned.credential_attestation.account_identity_fingerprint,
    );
    assert.equal(
      observation.claims_authentication_status,
      "verified_by_codex_agent_identity_auth",
    );
    assert.equal(
      observation.auth_source_generation_fingerprint,
      provisioned.projection.auth_source_generation_fingerprint,
    );
    assert.equal(provisioned.projection.config_policy.raw_provider_base_url, null);
    assert.equal(
      provisioned.projection.config_policy.requires_openai_auth,
      true,
    );
    assert.equal(
      provisioned.projection.config_policy.supports_websockets,
      true,
    );
    assert.equal(
      observation.tmp_identity_fingerprint.startsWith("sha256:"),
      true,
    );
    assertValidCodexIsolatedAuthObservationV01(
      observation,
      provisioned.projection,
    );
    const boundary = JSON.parse(
      readFileSync(positive.boundary_path, "utf8"),
    ) as Record<string, unknown>;
    assert.deepEqual(boundary, {
      app_server_material_present: true,
      environment_material_present: false,
      auth_snapshot_kind: "record",
      repository_child_material_present: false,
      shared_home_canary_visible: false,
      shared_codex_home_config_visible: false,
      shared_codex_home_history_visible: false,
      shared_codex_home_skills_visible: false,
      owned_tmp_present: true,
      shared_tmp_canary_visible: false,
      material_in_argv: false,
      file_store_policy_present: true,
      shell_core_policy_present: true,
      shell_sensitive_name_excludes_present: true,
    });
    assert.equal(readFileSync(positive.network_path, "utf8"), "0\n");
    assert.equal(readFileSync(positive.cleanup_path, "utf8"), "settled\n");
    assert.equal(readdirSync(positive.state_parent).length, 0);
    assert.equal(readdirSync(roots.lease).length, 0);

    const emailAbsent = await runProbeV01(
      roots,
      "email-absent",
      provisioned,
      FAKE_JWT,
      "isolated_auth_email_absent",
    );
    assert.equal(
      emailAbsent.result?.outcome,
      "completed",
      "email absence must not erase stable account identity",
    );
    const replacement = await runProbeV01(
      roots,
      "replacement",
      provisioned,
      FAKE_JWT,
      "isolated_auth_success",
    );
    assert.equal(replacement.result?.outcome, "completed");
    assert.notEqual(
      replacement.auth_observations[0]!.state_root_fingerprint,
      observation.state_root_fingerprint,
    );
    assert.notEqual(
      replacement.auth_observations[0]!.tmp_identity_fingerprint,
      observation.tmp_identity_fingerprint,
    );

    const receipt = buildRunReceiptV01({
      ...structuredClone(genericCliDirectObservationInputFixture),
      run_id: positive.result!.run_id,
      started_at: positive.result!.started_at,
      finished_at: positive.result!.finished_at,
      host_ref: positive.result!.host_refs[0] ?? null,
      result_summary: {
        summary: positive.result!.summary,
        outcome: "The isolated fake App Server completed.",
        limitations: [
          "Mechanics only; no provider authority or real credential was used.",
        ],
      },
    });
    assertPublicSafeV01({
      provisioned,
      observation,
      result: positive.result,
      lifecycle: positive.lifecycle_events,
      receipt,
    });

    await brokerAndProvisioningNegativesV01(roots, provisioned);
    await agentIdentityClaimNegativesV01(roots);
    await runtimePolicyNegativesV01(roots, provisioned);
    await tmpAndFailureNegativesV01(roots, provisioned);
    assertNoSecretFilesV01(roots.root);
    assert.equal(
      readFileSync(path.join(roots.ordinaryTmp, "foreign-temp-canary"), "utf8"),
      "ordinary-temp-untouched\n",
    );
    assert.equal(
      readFileSync(
        path.join(roots.ordinaryHome, "foreign-config.toml"),
        "utf8",
      ),
      "foreign-user-instruction=true\n",
    );
    assert.equal(existsSync(path.join(roots.ordinaryHome, "auth.json")), false);
    assert.equal(readdirSync(roots.lease).length, 0);

    console.log(
      JSON.stringify({
        status: "passed",
        mode: "contracts",
        contract_suite: "codex_isolated_auth_contracts.v0.1",
        projection_version: provisioned.projection.projection_version,
        attestation_version:
          provisioned.credential_attestation.attestation_version,
        seal_version: provisioned.projection_seal.seal_version,
        projection_fingerprint: provisioned.projection.integrity.fingerprint,
        attestation_fingerprint:
          provisioned.credential_attestation.integrity.fingerprint,
        seal_fingerprint: provisioned.projection_seal.integrity.fingerprint,
        operational_availability: provisioned.availability.state,
        malicious_consumer_secret_access: false,
        unique_account_identity_non_null: true,
        isolated_tmpdir: true,
        exact_observed_security_policy: true,
        semantic_profile_version:
          CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
        semantic_profile_fingerprint:
          CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
        config_tool_feature_schema_fingerprint:
          CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01
            .config_tool_feature_schema_fingerprint,
        config_policy_fingerprint:
          provisioned.projection.config_policy.policy_fingerprint,
        observed_security_policy_fingerprint:
          semanticProfileProof.fake.observed_security_policy_fingerprint,
        user_agent_contract_fingerprint:
          userAgentProof.contract_fingerprint,
        user_agent_negative_shapes_refused:
          userAgentProof.negative_shapes_refused,
        installed_cli_preflight: semanticProfileProof.installed.state,
        credential_free_fake_preflight: semanticProfileProof.fake.state,
        no_authorization_preflight_stop:
          executionGateProof.no_authorization_stop,
        unsupported_production_authority:
          executionGateProof.unsupported_production_authority,
        test_only_authorized_fake_turn:
          executionGateProof.authorized_fake_turn,
        authenticated_child_binding_version:
          CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01,
        arbitrary_child_wrapping_refused:
          provenanceProof.arbitrary_child_wrapping_refused,
        spawn_binding_matrix_refused:
          provenanceProof.spawn_binding_matrix_refused,
        real_keychain_accesses: 0,
        real_provider_calls: 0,
        successful_external_network_egress: 0,
        cleanup_complete: true,
      }),
    );
}

async function macOsKeychainReadTimeoutV01(roots: RootsV01): Promise<void> {
  const contract = macOsKeychainReadTimeoutContractForTestV01();
  assert.equal(contract.macos_keychain_read_timeout_ms, 60_000);
  assert.equal(contract.child_rollback_timeout_ms, 5_000);
  assert.equal(5_001 < contract.macos_keychain_read_timeout_ms, true);

  const fixtureRoot = path.join(roots.runtime, "keychain-read-timeout");
  mkdirSync(fixtureRoot, { mode: 0o700 });
  const delayedPidPath = path.join(fixtureRoot, "delayed.pid");
  const delayedExecutable = path.join(fixtureRoot, "delayed-keychain-read");
  const syntheticMaterial = "synthetic-keychain-material-must-not-be-public";
  writeFileSync(
    delayedExecutable,
    "#!/bin/sh\n" +
      `printf '%s' "$$" > ${JSON.stringify(delayedPidPath)}\n` +
      "/bin/sleep 0.075\n" +
      `printf '%s\\n' ${JSON.stringify(syntheticMaterial)}\n`,
    { mode: 0o700 },
  );
  const completed = await observeMacOsKeychainReadForTestV01({
    executable: delayedExecutable,
    keychain_path: path.join(fixtureRoot, "synthetic.keychain-db"),
    timeout_ms: 1_000,
  });
  assert.deepEqual(completed, {
    state: "completed",
    error_code: null,
    material_returned_internally: true,
  });
  assert.equal(JSON.stringify(completed).includes(syntheticMaterial), false);
  assertProcessNotAliveV01(Number(readFileSync(delayedPidPath, "utf8")));

  const blockedPidPath = path.join(fixtureRoot, "blocked.pid");
  const blockedExecutable = path.join(fixtureRoot, "blocked-keychain-read");
  writeFileSync(
    blockedExecutable,
    "#!/bin/sh\n" +
      `printf '%s' "$$" > ${JSON.stringify(blockedPidPath)}\n` +
      "while :; do :; done\n",
    { mode: 0o700 },
  );
  const timedOut = await observeMacOsKeychainReadForTestV01({
    executable: blockedExecutable,
    keychain_path: path.join(fixtureRoot, "synthetic.keychain-db"),
    timeout_ms: 1_000,
  });
  assert.deepEqual(timedOut, {
    state: "failed_closed",
    error_code: "codex_auth_broker_timeout",
    material_returned_internally: false,
  });
  assertProcessNotAliveV01(Number(readFileSync(blockedPidPath, "utf8")));
  assert.equal(readdirSync(roots.lease).length, 0);
  rmSync(fixtureRoot, { recursive: true, force: false });
}

function assertProcessNotAliveV01(pid: number): void {
  assert.equal(Number.isSafeInteger(pid) && pid > 0, true);
  assert.throws(
    () => process.kill(pid, 0),
    (error: unknown) =>
      error instanceof Error && Reflect.get(error, "code") === "ESRCH",
  );
}

async function officialAuthStorageAlignmentV01(roots: RootsV01): Promise<void> {
  const binding = bindingV01();
  const recordWithoutTask = {
    agent_runtime_id: BASE_CLAIMS.agent_runtime_id,
    agent_private_key: BASE_CLAIMS.agent_private_key,
    account_id: RAW_ACCOUNT_ID,
    chatgpt_user_id: RAW_USER_ID,
    email: "not-returned-to-augnes@example.invalid",
    plan_type: BASE_CLAIMS.plan_type,
    chatgpt_account_is_fedramp: BASE_CLAIMS.chatgpt_account_is_fedramp,
  } as const;
  const record = {
    ...recordWithoutTask,
    task_id: "fixture-agent-task",
  } as const;
  const directRecordStorage = officialAgentIdentityRecordStorageV01(record);
  const directRecordWithoutTaskStorage =
    officialAgentIdentityRecordStorageV01(recordWithoutTask);
  const managedStorage = officialManagedChatGptStorageV01(record);
  const managedRecordWithoutTaskStorage =
    officialManagedChatGptStorageV01(recordWithoutTask);
  const managedBootstrapRequiredStorage = officialManagedChatGptStorageV01(null);
  const apiKeyStorage = JSON.stringify({
    auth_mode: "apikey",
    OPENAI_API_KEY: ["sk", "fixture-not-a-real-key"].join("-"),
    agent_identity: null,
  });
  const fakeBrokerForMaterial = (material: string) =>
    createFakeCodexCredentialBrokerV01({
      binding,
      lease_root: roots.lease,
      entries: [
        {
          handle_external_id: binding.auth_handle_ref.external_id,
          material,
        },
      ],
    });
  const provisionMaterial = async (
    id: string,
    material: string,
  ): Promise<ProvisionCodexIsolatedAuthProjectionResultV01> => {
    const providerRef = refV01("model_provider", "openai");
    const provisioningBinding = createCodexIsolatedAuthProvisioningBindingV01({
      binding_id: `provisioning:${id}`,
      auth_handle_ref: binding.auth_handle_ref,
      broker_binding_fingerprint:
        credentialBrokerBindingFingerprintV01(binding),
      provider_ref: providerRef,
      codex_executable_fingerprint: sha256FileV01(process.execPath),
      executable_identity_class: "test_emulated_profile",
      compatible_codex_cli_version:
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      issued_at: GENERATED_AT,
      expires_at: EXPIRES_AT,
    });
    return await provisionCodexIsolatedAuthProjectionV01({
      projection_id: `codex-isolated-auth:${id}`,
      provisioning_binding: provisioningBinding,
      provisioning_binding_ref: refV01(
        "codex_auth_provisioning_binding",
        provisioningBinding.binding_id,
      ),
      provider_ref: providerRef,
      broker_binding: binding,
      broker: fakeBrokerForMaterial(material),
      codex_executable_ref: refV01("codex_executable", "node-test-host"),
      codex_executable_fingerprint: sha256FileV01(process.execPath),
      executable_identity_class: "test_emulated_profile",
      compatible_codex_cli_version:
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      issued_at: GENERATED_AT,
      expires_at: EXPIRES_AT,
    });
  };
  const availabilityForMaterial = async (material: string) =>
    await fakeBrokerForMaterial(material).availabilityV01({
      codex_executable_fingerprint: sha256FileV01(process.execPath),
      observed_at: GENERATED_AT,
    });

  const jwtStorage = officialAgentIdentityJwtStorageV01(FAKE_JWT);
  assert.equal(
    (await availabilityForMaterial(jwtStorage)).state,
    "agent_identity_task_registration_required",
  );
  await assert.rejects(
    () => provisionMaterial("official-auth-storage-jwt", jwtStorage),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code ===
        "codex_isolated_auth_agent_identity_task_registration_required",
  );

  assert.equal(
    (await availabilityForMaterial(directRecordWithoutTaskStorage)).state,
    "agent_identity_task_registration_required",
  );
  await assert.rejects(
    () =>
      provisionMaterial(
        "official-auth-storage-record-without-task",
        directRecordWithoutTaskStorage,
      ),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code ===
        "codex_isolated_auth_agent_identity_task_registration_required",
  );

  const recordProvisioned = await provisionMaterial(
    "official-auth-storage-record",
    directRecordStorage,
  );
  assert.equal(
    recordProvisioned.credential_attestation.agent_identity_storage_kind,
    "record",
  );
  assert.equal(
    recordProvisioned.credential_attestation.source_not_before_epoch_seconds,
    null,
  );
  assert.equal(
    recordProvisioned.credential_attestation.agent_identity_task_registration_state,
    "present",
  );
  assertPublicSafeV01(recordProvisioned);

  assert.equal(
    (await availabilityForMaterial(managedRecordWithoutTaskStorage)).state,
    "agent_identity_task_registration_required",
  );
  await assert.rejects(
    () =>
      provisionMaterial(
        "official-auth-storage-managed-record-without-task",
        managedRecordWithoutTaskStorage,
      ),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code ===
        "codex_isolated_auth_agent_identity_task_registration_required",
  );

  const managedProvisioned = await provisionMaterial(
    "official-auth-storage-managed-record",
    managedStorage,
  );
  assert.equal(
    managedProvisioned.credential_attestation.source_auth_mode,
    "chatgpt",
  );
  assert.equal(
    managedProvisioned.credential_attestation.managed_chatgpt_binding_verified,
    true,
  );
  assert.equal(
    managedProvisioned.credential_attestation.agent_identity_storage_kind,
    "record",
  );
  assertPublicSafeV01(managedProvisioned);

  const bootstrapBroker = fakeBrokerForMaterial(
    managedBootstrapRequiredStorage,
  );
  const bootstrapAvailability = await bootstrapBroker.availabilityV01({
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    observed_at: GENERATED_AT,
  });
  assert.equal(
    bootstrapAvailability.state,
    "agent_identity_bootstrap_required",
  );
  const managedJwtStorage = JSON.parse(
    managedBootstrapRequiredStorage,
  ) as Record<string, unknown>;
  managedJwtStorage.agent_identity = FAKE_JWT;
  assert.equal(
    (
      await fakeBrokerForMaterial(JSON.stringify(managedJwtStorage)).availabilityV01({
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        observed_at: GENERATED_AT,
      })
    ).state,
    "agent_identity_bootstrap_required",
    "managed ChatGPT reuses only the official Record form; a nested JWT does not bypass bootstrap",
  );
  assert.equal(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01
      .managed_chatgpt_agent_identity_route,
    "upstream_auth_manager_chatgpt_auth_policy",
  );
  assert.equal(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01.bootstrap_network_class,
    "credential_bootstrap_separate_from_task_provider_inference",
  );
  assert.equal(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01
      .external_execution_authorization_before_agent_identity_material,
    "forbidden",
  );
  await assert.rejects(
    () => provisionMaterial("managed-bootstrap-required", managedBootstrapRequiredStorage),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_agent_identity_bootstrap_required",
  );

  for (const [id, material] of [
    ["raw-jwt-storage-refused", FAKE_JWT],
    ["api-key-storage-refused", apiKeyStorage],
    [
      "api-key-agent-identity-refused",
      officialAgentIdentityJwtStorageV01(
        ["sk", "fixture-not-a-real-agent-identity"].join("-"),
      ),
    ],
  ] as const) {
    const availability = await fakeBrokerForMaterial(material).availabilityV01({
      codex_executable_fingerprint: sha256FileV01(process.execPath),
      observed_at: GENERATED_AT,
    });
    assert.equal(availability.state, "credential_shape_invalid", id);
  }

  const mismatchedManaged = officialManagedChatGptStorageV01({
    ...record,
    account_id: OTHER_ACCOUNT_ID,
  });
  assert.equal(
    (
      await fakeBrokerForMaterial(mismatchedManaged).availabilityV01({
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        observed_at: GENERATED_AT,
      })
    ).state,
    "account_identity_unavailable",
  );

  const expectedKeyringAccount = `cli|${createHash("sha256")
    .update(realpathSync(roots.ordinaryHome), "utf8")
    .digest("hex")
    .slice(0, 16)}`;
  assert.equal(
    codexAuthKeyringAccountForHomeV01(roots.ordinaryHome),
    expectedKeyringAccount,
  );

  const stateParent = path.join(roots.state, "official-record-preflight");
  const boundaryPath = path.join(
    roots.runtime,
    "official-record-preflight-boundary.json",
  );
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  const recordOwnerInput = ownerInputV01(
    roots,
    "official-record-preflight",
    recordProvisioned,
    FAKE_JWT,
    "isolated_auth_success",
    stateParent,
  );
  recordOwnerInput.broker = fakeBrokerForMaterial(directRecordStorage);
  recordOwnerInput.test_environment = {
    ...recordOwnerInput.test_environment,
    FAKE_CODEX_AUTH_BOUNDARY_PATH: boundaryPath,
  };
  const recordOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01(
    recordOwnerInput,
  );
  const session = await recordOwner.startAuthenticatedPreflightV01();
  await session.initializeV01();
  const observed = await session.observeAuthenticatedConfigurationV01({
    observed_at: GENERATED_AT,
  });
  assert.equal(observed.observation.auth_mode, "agent_identity");
  assert.equal(
    listFilesV01(stateParent).some((file) => path.basename(file) === "auth.json"),
    false,
    "attempt-private auth snapshot must be removed before observation returns",
  );
  const boundary = JSON.parse(readFileSync(boundaryPath, "utf8")) as Record<
    string,
    unknown
  >;
  assert.equal(boundary.auth_snapshot_kind, "record");
  assert.equal(boundary.environment_material_present, false);
  assert.equal(await session.shutdownAndCleanupV01(), true);
  assert.equal(readdirSync(stateParent).length, 0);
}

async function fileBackedAuthSourceV01(roots: RootsV01): Promise<void> {
  assert.deepEqual(codexAuthFilePlatformPolicyContractForTestV01("unix"), {
    platform_class: "unix",
    require_single_link: true,
    require_current_uid: true,
    require_private_posix_mode: true,
    open_flags_semantics: "read_only_no_follow",
  });
  assert.deepEqual(
    codexAuthFilePlatformPolicyContractForTestV01("non_unix"),
    {
      platform_class: "non_unix",
      require_single_link: false,
      require_current_uid: false,
      require_private_posix_mode: false,
      open_flags_semantics: "read_only",
    },
  );
  const sourceHome = path.join(roots.root, "file-backed-codex-home");
  const skillsDirectory = path.join(sourceHome, "skills");
  mkdirSync(skillsDirectory, { recursive: true, mode: 0o700 });
  writeFileSync(
    path.join(sourceHome, "auth.json"),
    officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
    { encoding: "utf8", mode: 0o600 },
  );
  writeFileSync(path.join(sourceHome, "config.toml"), "source-only=true\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  writeFileSync(
    path.join(sourceHome, "foreign-history.jsonl"),
    '{"source":"must-not-cross"}\n',
    { encoding: "utf8", mode: 0o600 },
  );
  writeFileSync(
    path.join(skillsDirectory, "source-only-skill.md"),
    "synthetic source-only skill must not cross\n",
    { encoding: "utf8", mode: 0o600 },
  );

  const binding = createCodexAuthFileBrokerBindingV01({
    source_codex_home: sourceHome,
    broker_executable_path: process.execPath,
  });
  assert.equal(
    binding.broker_locator_fingerprint,
    fingerprintCodexAuthFileLocatorV01({ source_codex_home: sourceHome }),
  );
  assert.equal(
    binding.broker_backend_ref.external_id,
    "codex-auth-dot-json-file",
  );
  assert.equal(
    binding.broker_executable_fingerprint,
    sha256FileV01(process.execPath),
  );
  assert.throws(
    () =>
      createCodexAuthFileBrokerForTestV01({
        binding: {
          ...binding,
          broker_backend_ref: refV01(
            "auth_broker_backend",
            "forged-file-auth-backend",
          ),
        },
        source_codex_home: sourceHome,
        broker_executable_path: process.execPath,
        lease_root: roots.lease,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_binding_mismatch",
  );
  const broker = createCodexAuthFileBrokerForTestV01({
    binding,
    source_codex_home: sourceHome,
    broker_executable_path: process.execPath,
    lease_root: roots.lease,
  });
  const availability = await broker.availabilityV01({
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    observed_at: GENERATED_AT,
  });
  assert.equal(availability.state, "available_exact");

  const providerRef = refV01("model_provider", "openai");
  const provisioningBinding = createCodexIsolatedAuthProvisioningBindingV01({
    binding_id: "provisioning:file-backed-source",
    auth_handle_ref: binding.auth_handle_ref,
    broker_binding_fingerprint:
      credentialBrokerBindingFingerprintV01(binding),
    provider_ref: providerRef,
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version:
      CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  const provisioned = await provisionCodexIsolatedAuthProjectionV01({
    projection_id: "codex-isolated-auth:file-backed-source",
    provisioning_binding: provisioningBinding,
    provisioning_binding_ref: refV01(
      "codex_auth_provisioning_binding",
      provisioningBinding.binding_id,
    ),
    provider_ref: providerRef,
    broker_binding: binding,
    broker,
    codex_executable_ref: refV01("codex_executable", "node-test-host"),
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version:
      CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  assert.equal(provisioned.availability.state, "available_exact");
  assert.equal(provisioned.projection.source_auth_mode, "agentIdentity");
  assertPublicSafeV01(provisioned);
  assertNoSecretApiV01(provisioned);
  const serializedPublicProjection = JSON.stringify(provisioned);
  for (const secret of SECRET_CANARIES)
    assert.equal(serializedPublicProjection.includes(secret), false);
  assert.equal(serializedPublicProjection.includes(sourceHome), false);

  const stateParent = path.join(roots.state, "file-backed-source-preflight");
  const boundaryPath = path.join(
    roots.runtime,
    "file-backed-source-preflight-boundary.json",
  );
  const ownerInput = ownerInputV01(
    roots,
    "file-backed-source-preflight",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
    stateParent,
  );
  ownerInput.broker = broker;
  ownerInput.test_environment = {
    ...ownerInput.test_environment,
    FAKE_CODEX_AUTH_BOUNDARY_PATH: boundaryPath,
  };
  const owner = new CodexIsolatedAuthenticatedExecutionOwnerV01(ownerInput);
  const session = await owner.startAuthenticatedPreflightV01();
  await session.initializeV01();
  await session.observeAuthenticatedConfigurationV01({
    observed_at: GENERATED_AT,
  });
  const boundary = JSON.parse(readFileSync(boundaryPath, "utf8")) as Record<
    string,
    unknown
  >;
  assert.equal(boundary.app_server_material_present, true);
  assert.equal(boundary.auth_snapshot_kind, "record");
  assert.equal(boundary.shared_codex_home_config_visible, false);
  assert.equal(boundary.shared_codex_home_history_visible, false);
  assert.equal(boundary.shared_codex_home_skills_visible, false);
  assert.equal(
    listFilesV01(stateParent).some((file) => path.basename(file) === "auth.json"),
    false,
  );
  assert.equal(await session.shutdownAndCleanupV01(), true);
  assert.equal(readdirSync(stateParent).length, 0);

  const syntheticHomes: string[] = [];
  const availabilityForFileSource = async (
    id: string,
    configure: (home: string) => void,
    options?: {
      file_platform_for_test?: "unix" | "non_unix";
      after_read_before_identity_recheck_for_test?: (home: string) => void;
    },
  ): Promise<string> => {
    const home = path.join(roots.root, `file-auth-negative-${id}`);
    syntheticHomes.push(home);
    mkdirSync(home, { mode: 0o700 });
    configure(home);
    const negativeBinding = createCodexAuthFileBrokerBindingV01({
      source_codex_home: home,
      broker_executable_path: process.execPath,
    });
    return (
      await createCodexAuthFileBrokerForTestV01({
        binding: negativeBinding,
        source_codex_home: home,
        broker_executable_path: process.execPath,
        lease_root: roots.lease,
        file_platform_for_test: options?.file_platform_for_test,
        after_read_before_identity_recheck_for_test:
          options?.after_read_before_identity_recheck_for_test === undefined
            ? null
            : () =>
                options.after_read_before_identity_recheck_for_test?.(home),
      }).availabilityV01({
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        observed_at: GENERATED_AT,
      })
    ).state;
  };
  assert.equal(
    await availabilityForFileSource("registration-required", (home) =>
      writeFileSync(
        path.join(home, "auth.json"),
        officialAgentIdentityJwtStorageV01(FAKE_JWT),
        { mode: 0o600 },
      ),
    ),
    "agent_identity_task_registration_required",
  );
  assert.equal(
    await availabilityForFileSource("managed-bootstrap", (home) =>
      writeFileSync(
        path.join(home, "auth.json"),
        officialManagedChatGptStorageV01(null),
        { mode: 0o600 },
      ),
    ),
    "agent_identity_bootstrap_required",
  );
  assert.equal(
    await availabilityForFileSource("malformed", (home) =>
      writeFileSync(path.join(home, "auth.json"), "{not-json", {
        mode: 0o600,
      }),
    ),
    "credential_shape_invalid",
  );
  assert.equal(
    await availabilityForFileSource(
      "unix-permissive",
      (home) => {
        const authPath = path.join(home, "auth.json");
        writeFileSync(
          authPath,
          officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
          { mode: 0o600 },
        );
        chmodSync(authPath, 0o644);
      },
      { file_platform_for_test: "unix" },
    ),
    "unsupported",
  );
  assert.equal(
    await availabilityForFileSource(
      "non-unix-permissive",
      (home) => {
        const authPath = path.join(home, "auth.json");
        writeFileSync(
          authPath,
          officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
          { mode: 0o600 },
        );
        chmodSync(authPath, 0o644);
      },
      { file_platform_for_test: "non_unix" },
    ),
    "available_exact",
  );
  assert.equal(
    await availabilityForFileSource(
      "non-unix-symlink",
      (home) => {
        const target = path.join(home, "synthetic-auth-target.json");
        writeFileSync(
          target,
          officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
          { mode: 0o600 },
        );
        symlinkSync(target, path.join(home, "auth.json"));
      },
      { file_platform_for_test: "non_unix" },
    ),
    "unsupported",
  );
  assert.equal(
    await availabilityForFileSource(
      "non-unix-oversized",
      (home) =>
        writeFileSync(path.join(home, "auth.json"), "x".repeat(64 * 1024 + 1), {
          mode: 0o600,
        }),
      { file_platform_for_test: "non_unix" },
    ),
    "unsupported",
  );
  assert.equal(
    await availabilityForFileSource(
      "non-unix-substituted",
      (home) =>
        writeFileSync(
          path.join(home, "auth.json"),
          officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
          { mode: 0o600 },
        ),
      {
        file_platform_for_test: "non_unix",
        after_read_before_identity_recheck_for_test: (home) =>
          writeFileSync(
            path.join(home, "auth.json"),
            `${officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT)}\n `,
            { mode: 0o600 },
          ),
      },
    ),
    "unsupported",
  );

  rmSync(sourceHome, { recursive: true, force: false });
  for (const home of syntheticHomes)
    rmSync(home, { recursive: true, force: false });
}

function userAgentContractV01(): {
  contract_fingerprint: string;
  negative_shapes_refused: number;
} {
  const authenticated = exactUserAgentV01("augnes");
  const semanticPreflight = exactUserAgentV01("augnes-semantic-preflight");
  for (const [name, raw] of [
    ["augnes", authenticated],
    ["augnes-semantic-preflight", semanticPreflight],
  ] as const) {
    const observed = observeCodexAppServerUserAgentV01({
      raw_user_agent: raw,
      expected_client_name: name,
      expected_client_version: CODEX_APP_SERVER_CLIENT_VERSION_V01,
      expected_codex_cli_version:
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    });
    assert.equal(
      observed.contract_version,
      CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
    );
    assert.equal(
      observed.contract_fingerprint,
      CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
    );
    assert.equal(observed.expected_originator_match, true);
    assert.equal(observed.expected_client_version_match, true);
    assert.equal(Object.hasOwn(observed, "raw_user_agent"), false);
  }
  const invalid = [
    "codex-cli/0.150.1",
    exactUserAgentV01("augnes").replace("augnes/", "other/"),
    exactUserAgentV01("augnes").replace(
      `; ${CODEX_APP_SERVER_CLIENT_VERSION_V01})`,
      "; codex_app_server_adapter.v9.9)",
    ),
    exactUserAgentV01("augnes").replace("/0.150.1 ", "/0.147.0 "),
    exactUserAgentV01("augnes").replace("Mac OS 15.7.1; ", ""),
    exactUserAgentV01("augnes").replace("15.7.1", "current"),
    `${exactUserAgentV01("augnes")} (augnes; ${CODEX_APP_SERVER_CLIENT_VERSION_V01})`,
    `${exactUserAgentV01("augnes")} unexpected`,
    `augnes/0.150.1 (Mac OS 15.7.1; arm64) ${"x".repeat(480)} (augnes; ${CODEX_APP_SERVER_CLIENT_VERSION_V01})`,
    exactUserAgentV01("augnes").replace("fake-terminal", "fake\u0000terminal"),
    exactUserAgentV01("augnes").replace("fake-terminal", "fake\ud800terminal"),
  ];
  for (const raw of invalid) {
    assert.throws(
      () =>
        observeCodexAppServerUserAgentV01({
          raw_user_agent: raw,
          expected_client_name: "augnes",
          expected_client_version: CODEX_APP_SERVER_CLIENT_VERSION_V01,
          expected_codex_cli_version:
            CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
        }),
      (error: unknown) => error instanceof CodexAppServerUserAgentErrorV01,
    );
  }
  assert.ok(invalid.at(-3)!.length > CODEX_APP_SERVER_USER_AGENT_MAX_LENGTH_V01);
  return {
    contract_fingerprint:
      CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
    negative_shapes_refused: invalid.length,
  };
}

function exactUserAgentV01(
  clientName: "augnes" | "augnes-semantic-preflight",
): string {
  return `${clientName}/${CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01} (Mac OS 15.7.1; arm64) fake-terminal/1.0 (${clientName}; ${CODEX_APP_SERVER_CLIENT_VERSION_V01})`;
}

async function rollbackLifecycleV01(roots: RootsV01): Promise<void> {
  const provisioned = await provisionV01(
    roots,
    "rollback-lifecycle",
    FAKE_JWT,
  );
  assert.equal(provisioned.availability.state, "available_exact");
  await leaseReleaseRollbackV01(roots, provisioned);
  await poisonWriteFailureReplayV01(roots);
  await exactProcessBirthRollbackV01();
  assertNoSecretFilesV01(roots.root);
  assert.equal(
    readFileSync(path.join(roots.ordinaryTmp, "foreign-temp-canary"), "utf8"),
    "ordinary-temp-untouched\n",
  );
  assert.equal(
    readFileSync(path.join(roots.ordinaryHome, "foreign-config.toml"), "utf8"),
    "foreign-user-instruction=true\n",
  );
  assert.equal(existsSync(path.join(roots.ordinaryHome, "auth.json")), false);
  assert.equal(readdirSync(roots.lease).length, 0);
  console.log(
    JSON.stringify({
      status: "passed",
      mode: "rollback-lifecycle",
      contract_suite: "codex_isolated_auth_rollback_lifecycle.v0.1",
      lease_release_rollback: true,
      retained_rollback_ownership: true,
      poison_replay_refused: true,
      exact_process_birth_substitution_refused: true,
      real_keychain_accesses: 0,
      real_provider_calls: 0,
      successful_external_network_egress: 0,
      cleanup_complete: true,
    }),
  );
}

async function authenticatedChildProvenanceV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<{
  arbitrary_child_wrapping_refused: true;
  spawn_binding_matrix_refused: true;
}> {
  const adapterExports = await import(
    "@/lib/vnext/native-host/codex-app-server-adapter"
  );
  assert.equal(
    Reflect.get(
      adapterExports,
      "createCodexIsolatedAuthenticatedPreflightSessionV01",
    ),
    undefined,
    "no exported factory may certify an arbitrary spawned child",
  );

  const stateParent = path.join(roots.state, "malicious-fake-child");
  const tracePath = path.join(
    roots.runtime,
    "malicious-fake-child.trace.jsonl",
  );
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  const owner = ownerV01(
    roots,
    "malicious-fake-child",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
    stateParent,
  );
  const foreignChild = spawn(
    process.execPath,
    [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
      "app-server",
      "--stdio",
    ],
    {
      cwd: roots.repository,
      env: {
        PATH: process.env.PATH,
        HOME: roots.ordinaryHome,
        CODEX_HOME: roots.ordinaryHome,
        CODEX_SQLITE_HOME: roots.ordinaryHome,
        TMPDIR: roots.ordinaryTmp,
        NODE_ENV: "test",
        AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
        FAKE_CODEX_SCENARIO: "isolated_auth_success",
        FAKE_CODEX_TRACE_PATH: tracePath,
      },
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  await waitForSpawnV01(foreignChild);
  try {
    let observationCallbackReached = false;
    const forgedBinding = Object.freeze({
      binding_version:
        CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01,
      binding_fingerprint: `sha256:${"0".repeat(64)}`,
    }) satisfies CodexIsolatedAuthenticatedChildBindingV01;
    await assert.rejects(
      () =>
        consumeCodexAuthenticatedChildBindingIntoPreflightV01({
          owner,
          authenticated_child_binding: forgedBinding,
          repository_root: roots.repository,
          observe_authenticated_configuration: () => {
            observationCallbackReached = true;
            throw new Error("forged binding callback must remain unreachable");
          },
          spawned_child: foreignChild,
        } as unknown as Parameters<
          typeof consumeCodexAuthenticatedChildBindingIntoPreflightV01
        >[0]),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_preflight_factory_input_invalid",
    );
    assert.equal(observationCallbackReached, false);
    assert.throws(
      () => owner.requireObservationV01(),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_observation_missing",
    );
    assert.equal(
      Reflect.get(owner, "observeInitializedAccountV01"),
      undefined,
      "authenticated observation minting must not be public",
    );
    assert.doesNotThrow(() => process.kill(foreignChild.pid!, 0));
    assert.equal(receivedMethodsV01(tracePath).includes("thread/start"), false);
    assert.equal(receivedMethodsV01(tracePath).includes("turn/start"), false);
  } finally {
    await stopTestOwnedChildV01(foreignChild);
    owner.cleanupV01();
  }
  assert.equal(readdirSync(stateParent).length, 0);

  const faults: readonly CodexAuthenticatedChildBindingFaultForTestV01[] = [
    "cloned_binding",
    "already_consumed",
    "wrong_owner",
    "wrong_projection",
    "wrong_attestation",
    "wrong_credential_generation",
    "wrong_semantic_profile",
    "wrong_executable",
    "wrong_repository_root",
    "wrong_state_root",
    "wrong_pid",
    "wrong_birth_identity",
    "substituted_child",
    "wrong_launch_shape",
  ];
  for (const fault of faults) {
    const faultStateParent = path.join(
      roots.state,
      `authenticated-child-binding-${fault}`,
    );
    const faultTracePath = path.join(
      roots.runtime,
      `authenticated-child-binding-${fault}.trace.jsonl`,
    );
    const faultInput = ownerInputV01(
      roots,
      `authenticated-child-binding-${fault}`,
      provisioned,
      FAKE_JWT,
      "isolated_auth_success",
      faultStateParent,
    );
    faultInput.test_environment = {
      ...faultInput.test_environment,
      FAKE_CODEX_TRACE_PATH: faultTracePath,
    };
    const faultOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01(
      faultInput,
    );
    configureCodexAuthenticatedChildBindingFaultForTestV01(
      faultOwner,
      fault,
    );
    await assert.rejects(
      () => faultOwner.startAuthenticatedPreflightV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        [
          "codex_auth_broker_authenticated_child_binding_refused",
          "codex_auth_broker_authenticated_child_binding_replayed",
        ].includes(error.code),
      fault,
    );
    assert.throws(
      () => faultOwner.requireObservationV01(),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_observation_missing",
      fault,
    );
    assert.equal(
      receivedMethodsV01(faultTracePath).includes("thread/start"),
      false,
      fault,
    );
    assert.equal(
      receivedMethodsV01(faultTracePath).includes("turn/start"),
      false,
      fault,
    );
    assert.equal(readdirSync(faultStateParent).length, 0, fault);
  }
  assert.equal(readdirSync(roots.lease).length, 0);
  return {
    arbitrary_child_wrapping_refused: true,
    spawn_binding_matrix_refused: true,
  };
}

async function semanticProfileAndCredentialFreePreflightV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<{
  fake: CodexIsolatedAuthCredentialFreePreflightV01;
  installed: { state: CodexIsolatedAuthCredentialFreePreflightV01["state"] };
}> {
  const profile = CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01;
  assert.equal(
    profile.semantic_profile_version,
    "codex_isolated_auth_semantic_profile.rust-v0.150.1",
  );
  assert.equal(profile.upstream_tag, "rust-v0.150.1");
  assert.equal(
    profile.upstream_source_commit,
    "90854393966b21e9ebfd21b122334eb09a20c93d",
  );
  assert.equal(
    profile.supported_public_cli_version,
    CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  );
  assert.equal(
    profile.pinned_production_executable_fingerprint,
    CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01,
  );
  assert.equal(
    profile.agent_identity_claim_contract_version,
    CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01,
  );
  assert.equal(
    profile.agent_identity_claim_contract_fingerprint,
    "sha256:5db3700db96d5ac17ba41b3a42299d32a27616a214859a2955437624370f4f47",
  );
  assert.equal(
    profile.app_server_user_agent_contract_version,
    CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  );
  assert.equal(
    profile.app_server_user_agent_contract_fingerprint,
    CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
  );
  assert.equal(
    profile.config_tool_feature_schema_fingerprint,
    "sha256:baa7d22bafadad873f099713288596bdfd3f9873f737773b35e20aa954a0ea22",
  );
  assert.equal(
    profile.auth_storage_contract_version,
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
  );
  assert.equal(
    profile.auth_storage_contract_fingerprint,
    "sha256:d5bceae3a650f62a1d910e8adda538d798eb27a85c0df5350b5bc633594f6282",
  );
  assert.equal(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01.keyring_service,
    CODEX_AUTH_KEYRING_SERVICE_V01,
  );
  assert.deepEqual(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01.supported_source_stores,
    ["file", "macos_direct_keyring"],
  );
  assert.equal(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01.file_source_location,
    "CODEX_HOME/auth.json",
  );
  assert.equal(
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01.manual_agent_identity_jwt_required,
    false,
  );
  const configOverrideArgs: readonly string[] =
    CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01;
  assert.equal(configOverrideArgs[0], "--strict-config");
  const configOverridePaths: string[] = [];
  for (let index = 1; index < configOverrideArgs.length; index += 2) {
    assert.equal(configOverrideArgs[index], "-c");
    const expression = configOverrideArgs[index + 1]!;
    configOverridePaths.push(expression.slice(0, expression.indexOf("=")));
  }
  assert.deepEqual(
    codexIsolatedAuthExpectedRuntimeOverridePathsV01(),
    configOverridePaths,
    "every -c override must own exactly one SessionFlags projection path",
  );
  assert.equal(configOverridePaths.length, 39);
  assert.equal(new Set(configOverridePaths).size, configOverridePaths.length);
  const runtimeOriginPaths = codexIsolatedAuthExpectedRuntimeOriginPathsV01();
  assert.equal(runtimeOriginPaths.length, 35);
  assert.equal(configOverridePaths.includes("sqlite_home"), false);
  assert.equal(runtimeOriginPaths.includes("sqlite_home"), false);
  for (const emptyContainerPath of [
    "mcp_servers",
    "plugins",
    "skills",
    "apps",
    "project_doc_fallback_filenames",
  ]) {
    assert.equal(configOverridePaths.includes(emptyContainerPath), true);
    assert.equal(
      runtimeOriginPaths.includes(emptyContainerPath),
      false,
      `${emptyContainerPath} remains proven by the SessionFlags layer because upstream emits no origin leaf for empty containers`,
    );
  }
  assert.equal(runtimeOriginPaths.includes("features.network_proxy"), true);
  assert.equal(
    runtimeOriginPaths.includes("features.network_proxy.enabled"),
    true,
  );
  for (const feature of [
    "auth_elicitation",
    "mcp_2026_07_28",
    "memories",
    "mentions_v2",
    "remote_plugin",
    "tool_suggest",
  ]) {
    assert.equal(
      configOverrideArgs.includes(`features.${feature}=false`),
      true,
      `${feature} must be explicitly disabled for the isolated profile`,
    );
  }
  assert.equal(
    configOverrideArgs.includes("features.remote_control=false"),
    false,
    "removed 0.150.1 remote_control is a source-injected false observation, not an effective override",
  );
  assert.equal(
    profile.integrity.fingerprint,
    "sha256:0c2275335eb069ccd251dade36df03b6f4f0842deedc1d8d12191dadfa917058",
  );
  assert.equal(
    provisioned.projection.semantic_profile_fingerprint,
    profile.integrity.fingerprint,
  );
  assert.equal(
    provisioned.projection.compatible_codex_cli_version,
    CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  );
  assert.equal(
    provisioned.projection.config_policy.remote_tool_features_enabled,
    0,
  );
  assert.equal(
    provisioned.projection.config_policy.config_layer_policy,
    "session_flags_exact_no_active_non_session_layers",
  );
  assert.equal(
    provisioned.projection.config_policy.config_requirements_policy,
    "not_enumerated_critical_override_origins_intact",
  );
  assert.equal(
    provisioned.projection.config_policy.sqlite_config_projection,
    "absent",
  );
  assert.equal(
    provisioned.projection.config_policy.sqlite_runtime_binding,
    "private_codex_sqlite_home_environment",
  );
  assert.equal(
    provisioned.projection.config_policy.sqlite_runtime_source,
    "CODEX_SQLITE_HOME",
  );
  assert.equal(
    provisioned.projection.config_policy.sqlite_runtime_private_root_required,
    true,
  );
  assert.equal(
    provisioned.projection.config_policy
      .sqlite_runtime_shared_fallback_forbidden,
    true,
  );
  assert.equal(
    provisioned.projection.config_policy.apps_config_projection,
    "source_default_only",
  );
  assert.equal(
    provisioned.projection.config_policy.apps_capability,
    "disabled_by_feature",
  );
  assert.equal(
    provisioned.projection.config_policy.policy_fingerprint,
    "sha256:f8681edeae0ba1a80aa810e473a73fb14f287e5bb5ae2b1f542b58ddb2299c1d",
  );

  for (const version of ["0.147.0", "0.150.0", "0.151.0", "not-a-version"]) {
    assert.throws(
      () =>
        createCodexIsolatedAuthProvisioningBindingV01({
          binding_id: `provisioning:wrong-version:${version}`,
          auth_handle_ref: bindingV01().auth_handle_ref,
          broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(
            bindingV01(),
          ),
          provider_ref: refV01("model_provider", "openai"),
          codex_executable_fingerprint: sha256FileV01(process.execPath),
          executable_identity_class: "test_emulated_profile",
          compatible_codex_cli_version:
            version as typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
          issued_at: GENERATED_AT,
          expires_at: EXPIRES_AT,
        }),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        (error.code === "codex_isolated_auth_cli_version_mismatch" ||
          error.code === "codex_isolated_auth_cli_version_invalid"),
      version,
    );
  }
  assert.throws(
    () =>
      createCodexIsolatedAuthProvisioningBindingV01({
        binding_id: "provisioning:wrong-production-executable",
        auth_handle_ref: bindingV01().auth_handle_ref,
        broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(
          bindingV01(),
        ),
        provider_ref: refV01("model_provider", "openai"),
        codex_executable_fingerprint:
          "sha256:19c4f144c5226a9f17c58e6f0fa854843b0f77a6eb420f40e2745a12f10f5d37",
        executable_identity_class: "production_pinned_codex",
        compatible_codex_cli_version:
          CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_production_executable_mismatch",
  );
  const staleExecutablePreflight =
    await probeCodexIsolatedAuthCredentialFreeCompatibilityV01({
      command: process.execPath,
      expected_executable_fingerprint:
        "sha256:19c4f144c5226a9f17c58e6f0fa854843b0f77a6eb420f40e2745a12f10f5d37",
      executable_identity_class: "production_pinned_codex",
      state_parent: roots.state,
      repository_root: roots.repository,
      observed_at: GENERATED_AT,
    });
  assert.equal(staleExecutablePreflight.state, "executable_mismatch");
  assert.equal(staleExecutablePreflight.cleanup_completed, true);
  const substitutedProfile = structuredClone(
    provisioned.projection,
  ) as CodexIsolatedAuthProjectionV01;
  (substitutedProfile as unknown as Record<string, unknown>)[
    "semantic_profile_fingerprint"
  ] = `sha256:${"d".repeat(64)}`;
  assert.throws(
    () =>
      assertValidCodexIsolatedAuthProjectionV01(
        substitutedProfile,
        provisioned.credential_attestation,
        provisioned.projection_seal,
      ),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01,
  );

  const fakeStateParent = path.join(roots.state, "semantic-preflight-fake");
  const fakeRuntime = path.join(roots.runtime, "semantic-preflight-fake");
  const fakeTrace = path.join(fakeRuntime, "trace.jsonl");
  const fakeNetwork = path.join(fakeRuntime, "network-count.txt");
  const fakeAuthBoundary = path.join(fakeRuntime, "auth-boundary.jsonl");
  mkdirSync(fakeStateParent, { recursive: true, mode: 0o700 });
  mkdirSync(fakeRuntime, { recursive: true, mode: 0o700 });
  const fake = await probeCodexIsolatedAuthCredentialFreeCompatibilityV01({
    command: process.execPath,
    expected_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    state_parent: realpathSync(fakeStateParent),
    repository_root: roots.repository,
    base_environment: {
      PATH: process.env.PATH,
      LANG: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
    test_prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: "isolated_auth_semantic_preflight",
      FAKE_CODEX_TRACE_PATH: fakeTrace,
      FAKE_CODEX_NETWORK_COUNT_PATH: fakeNetwork,
      FAKE_CODEX_AUTH_BOUNDARY_PATH: fakeAuthBoundary,
    },
    observed_at: GENERATED_AT,
  });
  assert.equal(fake.state, "compatible_exact");
  assert.equal(
    fake.observed_cli_version,
    CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  );
  assert.equal(fake.cleanup_completed, true);
  assert.equal(
    fake.observed_security_policy_fingerprint,
    "sha256:f8681edeae0ba1a80aa810e473a73fb14f287e5bb5ae2b1f542b58ddb2299c1d",
  );
  assert.equal(readdirSync(fakeStateParent).length, 0);
  const fakeMethods = receivedMethodsV01(fakeTrace);
  assert.deepEqual(fakeMethods, ["initialize", "initialized", "config/read"]);
  const configReadShape = traceValuesV01(
    fakeTrace,
    "isolated_auth_config_read_shape",
  )[0];
  assert.equal(configReadShape?.requirements_field_present, false);
  assert.equal(configReadShape?.session_flags_layer_count, 1);
  assert.equal(configReadShape?.sqlite_home_is_null, true);
  assert.equal(configReadShape?.sqlite_home_origin_present, false);
  assert.deepEqual(configReadShape?.apps_top_level_keys, ["_default"]);
  assert.equal(configReadShape?.apps_per_app_count, 0);
  assert.equal(
    typeof configReadShape?.layer_count === "number" &&
      configReadShape.layer_count > 1,
    true,
    "production-shaped config/read must include SessionFlags plus empty lower layers",
  );
  assert.equal(
    typeof configReadShape?.origin_count === "number" &&
      configReadShape.origin_count > 0,
    true,
  );
  for (const forbiddenMethod of [
    "configRequirements/read",
    "account/read",
    "getAuthStatus",
    "mcpServerStatus/list",
    "thread/start",
    "turn/start",
  ])
    assert.equal(fakeMethods.includes(forbiddenMethod), false, forbiddenMethod);
  const credentialFreeBoundary = JSON.parse(
    readFileSync(fakeAuthBoundary, "utf8"),
  ) as Record<string, unknown>;
  assert.equal(credentialFreeBoundary.app_server_material_present, false);
  assert.equal(credentialFreeBoundary.repository_child_material_present, false);
  assert.equal(credentialFreeBoundary.shared_home_canary_visible, false);
  assert.equal(credentialFreeBoundary.shared_codex_home_config_visible, false);
  assert.equal(credentialFreeBoundary.shared_codex_home_history_visible, false);
  assert.equal(credentialFreeBoundary.shared_codex_home_skills_visible, false);
  assert.equal(credentialFreeBoundary.shared_tmp_canary_visible, false);
  assert.equal(credentialFreeBoundary.material_in_argv, false);
  assert.equal(readFileSync(fakeNetwork, "utf8"), "0\n");
  assertPublicSafeV01(fake);

  await credentialFreeFeatureProjectionNegativesV01(roots);
  await codex01521QualificationContractV01(roots);

  // Source and Canonical conformance must never promote an installed binary
  // into a production observation. Exact-head production probing is a later,
  // separately authorized gate.
  return { fake, installed: { state: "unavailable" } };
}

async function codex01521QualificationContractV01(
  roots: RootsV01,
): Promise<void> {
  const stateParent = path.join(roots.state, "qualification-0-152-1");
  const runtime = path.join(roots.runtime, "qualification-0-152-1");
  const tracePath = path.join(runtime, "trace.jsonl");
  const networkPath = path.join(runtime, "network-count.txt");
  const authBoundaryPath = path.join(runtime, "auth-boundary.jsonl");
  mkdirSync(stateParent, { mode: 0o700 });
  mkdirSync(runtime, { mode: 0o700 });
  const qualificationInput = {
    command: process.execPath,
    upstream_tag: CODEX_0_152_1_UPSTREAM_TAG_V01,
    upstream_source_commit: CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01,
    semantic_profile_fingerprint:
      CODEX_0_152_1_QUALIFICATION_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    executable_identity_class: "test_emulated_profile" as const,
    state_parent: realpathSync(stateParent),
    repository_root: roots.repository,
    base_environment: {
      PATH: process.env.PATH,
      LANG: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
    test_prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: "isolated_auth_qualification_0_152_1_success",
      FAKE_CODEX_TRACE_PATH: tracePath,
      FAKE_CODEX_NETWORK_COUNT_PATH: networkPath,
      FAKE_CODEX_AUTH_BOUNDARY_PATH: authBoundaryPath,
    },
    test_release_archive_fingerprint:
      CODEX_0_152_1_RELEASE_ARCHIVE_FINGERPRINT_V01,
    observed_at: GENERATED_AT,
  };
  const compatible = await qualifyCodex01521ExactCompatibilityV01(
    qualificationInput,
  );
  assert.equal(compatible.state, "compatible_emulated");
  assert.equal(compatible.verdict, "HOLD / NOT_QUALIFIED");
  assert.equal(compatible.production_selected, false);
  assert.equal(compatible.production_compatibility_status, "not_qualified");
  assert.equal(compatible.production_cutover_authorized, false);
  assert.equal(compatible.cli_reported_version, null);
  assert.equal(compatible.app_server_reported_cli_version, "0.152.1");
  assert.equal(
    compatible.semantic_profile_fingerprint,
    CODEX_0_152_1_QUALIFICATION_SEMANTIC_PROFILE_V01.integrity.fingerprint,
  );
  assert.equal(
    compatible.production_profile_fingerprint,
    "sha256:0c2275335eb069ccd251dade36df03b6f4f0842deedc1d8d12191dadfa917058",
  );
  assert.notEqual(
    compatible.semantic_profile_fingerprint,
    compatible.production_profile_fingerprint,
  );
  assert.equal(compatible.private_environment_observed, true);
  assert.equal(compatible.cleanup_completed, true);
  assert.equal(readdirSync(stateParent).length, 0);
  assert.deepEqual(receivedMethodsV01(tracePath), [
    "initialize",
    "initialized",
    "config/read",
  ]);
  assert.equal(readFileSync(networkPath, "utf8"), "0\n");
  const boundary = JSON.parse(
    readFileSync(authBoundaryPath, "utf8"),
  ) as Record<string, unknown>;
  assert.equal(boundary.app_server_material_present, false);
  assert.equal(boundary.repository_child_material_present, false);
  assert.equal(boundary.shared_home_canary_visible, false);
  assert.equal(boundary.shared_codex_home_config_visible, false);
  assert.equal(boundary.shared_codex_home_history_visible, false);
  assert.equal(boundary.shared_codex_home_skills_visible, false);
  assert.equal(boundary.shared_tmp_canary_visible, false);
  assertPublicSafeV01(compatible);

  const wrongExecutable = await qualifyCodex01521ExactCompatibilityV01({
    ...qualificationInput,
    test_expected_executable_fingerprint: `sha256:${"0".repeat(64)}`,
    observed_at: GENERATED_AT,
  });
  assert.equal(wrongExecutable.state, "executable_mismatch");
  assert.equal(wrongExecutable.verdict, "HOLD / NOT_QUALIFIED");
  assert.equal(
    wrongExecutable.production_compatibility_status,
    "not_qualified",
  );
  assert.equal(wrongExecutable.production_selected, false);
  assert.equal(wrongExecutable.production_cutover_authorized, false);

  for (const [id, override, expectedState] of [
    [
      "wrong-tag",
      { upstream_tag: "rust-v0.152.0" },
      "release_identity_mismatch",
    ],
    [
      "wrong-source",
      { upstream_source_commit: "0".repeat(40) },
      "release_identity_mismatch",
    ],
    [
      "wrong-archive",
      { test_release_archive_fingerprint: `sha256:${"0".repeat(64)}` },
      "release_identity_mismatch",
    ],
    [
      "stale-profile",
      { semantic_profile_fingerprint: `sha256:${"0".repeat(64)}` },
      "semantic_profile_mismatch",
    ],
  ] as const) {
    const rejected = await qualifyCodex01521ExactCompatibilityV01({
      ...qualificationInput,
      ...override,
      observed_at: GENERATED_AT,
    });
    assert.equal(rejected.state, expectedState, id);
    assert.equal(rejected.verdict, "HOLD / NOT_QUALIFIED", id);
    assert.equal(rejected.production_selected, false, id);
    assert.equal(rejected.production_compatibility_status, "not_qualified", id);
    assert.equal(rejected.production_cutover_authorized, false, id);
  }

  const wrongCli = await qualifyCodex01521ExactCompatibilityV01({
    ...qualificationInput,
    test_environment: {
      ...qualificationInput.test_environment,
      FAKE_CODEX_SCENARIO:
        "isolated_auth_qualification_0_152_1_cli_mismatch",
    },
    observed_at: GENERATED_AT,
  });
  assert.equal(wrongCli.state, "version_mismatch");
  assert.equal(wrongCli.verdict, "HOLD / NOT_QUALIFIED");
  assert.equal(wrongCli.production_selected, false);
  assert.equal(wrongCli.production_compatibility_status, "not_qualified");
  assert.equal(wrongCli.production_cutover_authorized, false);
  assert.equal(readdirSync(stateParent).length, 0);
}

async function credentialFreeFeatureProjectionNegativesV01(
  roots: RootsV01,
): Promise<void> {
  for (const [id, scenario] of [
    ["auth-elicitation-enabled", "isolated_auth_feature_auth_elicitation_enabled"],
    ["mentions-v2-enabled", "isolated_auth_feature_mentions_v2_enabled"],
    ["memories-enabled", "isolated_auth_feature_memories_enabled"],
    ["mcp-2026-07-28-enabled", "isolated_auth_feature_mcp_2026_07_28_enabled"],
    ["remote-plugin-enabled", "isolated_auth_feature_remote_plugin_enabled"],
    ["tool-suggest-enabled", "isolated_auth_feature_tool_suggest_enabled"],
    ["remote-control-enabled", "isolated_auth_feature_remote_control_enabled"],
    ["unknown-feature-false", "isolated_auth_unknown_feature_drift"],
    ["required-feature-missing", "isolated_auth_feature_required_missing"],
    [
      "session-flags-missing",
      "isolated_auth_provenance_session_flags_missing",
    ],
    [
      "session-flags-duplicate",
      "isolated_auth_provenance_session_flags_duplicate",
    ],
    [
      "non-empty-user-layer",
      "isolated_auth_provenance_non_empty_user_layer",
    ],
    [
      "non-empty-system-layer",
      "isolated_auth_provenance_non_empty_system_layer",
    ],
    [
      "non-empty-project-layer",
      "isolated_auth_provenance_non_empty_project_layer",
    ],
    [
      "non-empty-mdm-layer",
      "isolated_auth_provenance_non_empty_mdm_layer",
    ],
    [
      "non-empty-enterprise-layer",
      "isolated_auth_provenance_non_empty_enterprise_layer",
    ],
    [
      "expected-origin-missing",
      "isolated_auth_provenance_expected_origin_missing",
    ],
    ["origin-user", "isolated_auth_provenance_origin_user"],
    ["origin-managed", "isolated_auth_provenance_origin_managed"],
    [
      "unknown-active-origin",
      "isolated_auth_provenance_unknown_active_origin",
    ],
    [
      "packaged-defaults-surfaced",
      "isolated_auth_provenance_packaged_defaults_surface",
    ],
    [
      "malformed-layer-metadata",
      "isolated_auth_provenance_malformed_layer_metadata",
    ],
    ["sqlite-origin-present", "isolated_auth_sqlite_home_origin_drift"],
    ["apps-per-app", "isolated_auth_apps_per_app_drift"],
    ["apps-default-malformed", "isolated_auth_apps_default_malformed"],
    ["apps-default-active", "isolated_auth_apps_default_active"],
    ["apps-unknown-key", "isolated_auth_apps_unknown_key"],
  ] as const) {
    const stateParent = path.join(roots.state, `credential-free-${id}`);
    const runtime = path.join(roots.runtime, `credential-free-${id}`);
    const tracePath = path.join(runtime, "trace.jsonl");
    const networkPath = path.join(runtime, "network-count.txt");
    const authBoundaryPath = path.join(runtime, "auth-boundary.jsonl");
    mkdirSync(stateParent, { mode: 0o700 });
    mkdirSync(runtime, { mode: 0o700 });
    const preflight =
      await probeCodexIsolatedAuthCredentialFreeCompatibilityV01({
        command: process.execPath,
        expected_executable_fingerprint: sha256FileV01(process.execPath),
        executable_identity_class: "test_emulated_profile",
        state_parent: realpathSync(stateParent),
        repository_root: roots.repository,
        base_environment: {
          PATH: process.env.PATH,
          LANG: "C",
          TZ: "UTC",
          NO_COLOR: "1",
        },
        test_prefix_args: [
          path.join(
            process.cwd(),
            "scripts",
            "fixtures",
            "fake-codex-app-server.mjs",
          ),
        ],
        test_environment: {
          AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
          FAKE_CODEX_SCENARIO: scenario,
          FAKE_CODEX_TRACE_PATH: tracePath,
          FAKE_CODEX_NETWORK_COUNT_PATH: networkPath,
          FAKE_CODEX_AUTH_BOUNDARY_PATH: authBoundaryPath,
        },
        observed_at: GENERATED_AT,
      });
    assert.equal(preflight.state, "semantic_profile_mismatch", scenario);
    assert.equal(preflight.cleanup_completed, true, scenario);
    assert.equal(readdirSync(stateParent).length, 0, scenario);
    const methods = receivedMethodsV01(tracePath);
    assert.deepEqual(
      methods,
      ["initialize", "initialized", "config/read"],
      scenario,
    );
    for (const forbiddenMethod of [
      "configRequirements/read",
      "account/read",
      "getAuthStatus",
      "mcpServerStatus/list",
      "thread/start",
      "turn/start",
    ])
      assert.equal(methods.includes(forbiddenMethod), false, forbiddenMethod);
    const boundary = JSON.parse(
      readFileSync(authBoundaryPath, "utf8"),
    ) as Record<string, unknown>;
    assert.equal(boundary.app_server_material_present, false, scenario);
    assert.equal(boundary.repository_child_material_present, false, scenario);
    assert.equal(boundary.material_in_argv, false, scenario);
    assert.equal(readFileSync(networkPath, "utf8"), "0\n", scenario);
    assertPublicSafeV01(preflight);
  }
}

async function externalExecutionAuthorityGateV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<{
  no_authorization_stop: string;
  unsupported_production_authority: "refused_before_turn";
  authorized_fake_turn: "completed_once";
}> {
  assert.equal(provisioned.projection.authority.provider_call_granted, false);
  assert.equal(
    provisioned.projection.authority.repository_execution_granted,
    false,
  );
  const binding = createCodexIsolatedAuthProvisioningBindingV01({
    binding_id: "provisioning:authority-classification",
    auth_handle_ref: bindingV01().auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(
      bindingV01(),
    ),
    provider_ref: refV01("model_provider", "openai"),
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  assert.equal(binding.authority.is_execution_authority, false);
  assert.equal(binding.authority.is_provider_authority, false);
  assert.equal(binding.authority.provider_call_granted, false);
  assert.equal(binding.authority.repository_execution_granted, false);

  const noAuthorization = await runProbeV01(
    roots,
    "execution-gate-absent",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
    "absent",
  );
  assert.equal(noAuthorization.error, null);
  assert.equal(noAuthorization.settled_error, null);
  assert.equal(noAuthorization.result?.outcome, "unavailable");
  assert.equal(
    noAuthorization.result?.public_stop_reason,
    "codex_isolated_auth_external_execution_authorization_required",
  );
  assert.equal(noAuthorization.auth_observations.length, 1);
  const noAuthorizationMethods = receivedMethodsV01(
    noAuthorization.trace_path,
  );
  for (const method of [
    "initialize",
    "account/read",
    "getAuthStatus",
    "config/read",
    "mcpServerStatus/list",
  ])
    assert.equal(noAuthorizationMethods.includes(method), true, method);
  assert.equal(noAuthorizationMethods.includes("thread/start"), false);
  assert.equal(noAuthorizationMethods.includes("turn/start"), false);
  assert.equal(readdirSync(noAuthorization.state_parent).length, 0);

  const unsupportedProduction = await runProbeV01(
    roots,
    "execution-gate-unsupported-production-authority",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
    "unsupported_production",
  );
  assert.equal(unsupportedProduction.result?.outcome, "failed");
  assert.equal(
    unsupportedProduction.result?.public_stop_reason,
    "codex_isolated_auth_external_execution_authorization_refused",
  );
  assert.equal(unsupportedProduction.auth_observations.length, 1);
  assert.equal(
    Object.values(unsupportedProduction.execution_authorization ?? {}).some(
      (value) => typeof value === "function",
    ),
    false,
  );
  const unsupportedMethods = receivedMethodsV01(
    unsupportedProduction.trace_path,
  );
  for (const method of [
    "initialize",
    "account/read",
    "getAuthStatus",
    "config/read",
    "mcpServerStatus/list",
  ])
    assert.equal(unsupportedMethods.includes(method), true, method);
  assert.equal(unsupportedMethods.includes("thread/start"), false);
  assert.equal(unsupportedMethods.includes("turn/start"), false);
  assert.equal(
    readFileSync(unsupportedProduction.network_path, "utf8"),
    "0\n",
  );
  assert.equal(readdirSync(unsupportedProduction.state_parent).length, 0);

  for (const variant of [
    "wrong_request",
    "wrong_run",
    "cloned",
    "expired",
    "substituted_root",
    "substituted_projection",
    "substituted_environment",
    "substituted_provider",
    "substituted_route",
    "substituted_model",
    "substituted_ordinal",
    "substituted_ceiling",
    "substituted_fallback",
  ] as const) {
    const refused = await runProbeV01(
      roots,
      `execution-gate-${variant}`,
      provisioned,
      FAKE_JWT,
      "isolated_auth_success",
      variant,
    );
    assert.equal(refused.result?.outcome, "failed", variant);
    assert.equal(
      refused.result?.public_stop_reason,
      "codex_isolated_auth_external_execution_authorization_refused",
      variant,
    );
    const methods = receivedMethodsV01(refused.trace_path);
    assert.equal(methods.includes("thread/start"), false, variant);
    assert.equal(methods.includes("turn/start"), false, variant);
    assert.equal(readdirSync(refused.state_parent).length, 0, variant);
  }

  const foreignAuthorizationOwner = ownerV01(
    roots,
    "execution-gate-foreign-authorization-owner",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
  );
  const foreignSessionState = path.join(
    roots.state,
    "execution-gate-foreign-preflight-owner",
  );
  const foreignSessionTrace = path.join(
    roots.runtime,
    "execution-gate-foreign-preflight-owner.trace.jsonl",
  );
  const foreignSessionInput = ownerInputV01(
    roots,
    "execution-gate-foreign-preflight-owner",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
    foreignSessionState,
  );
  foreignSessionInput.test_environment = {
    ...foreignSessionInput.test_environment,
    FAKE_CODEX_TRACE_PATH: foreignSessionTrace,
  };
  const foreignSessionOwner =
    new CodexIsolatedAuthenticatedExecutionOwnerV01(foreignSessionInput);
  const foreignOwnerRequest = requestV01(
    roots.repository,
    "execution-gate-foreign-owner",
  );
  const foreignOwnerAuthorization =
    createCodexIsolatedAuthTestExecutionAuthorizationV01({
      owner: foreignAuthorizationOwner,
      request: foreignOwnerRequest,
      external_authorization_ref: refV01(
        "codex_isolated_auth_test_execution_authorization",
        "test-execution:foreign-owner",
      ),
      expires_at: EXPIRES_AT,
    });
  const foreignOwnerInvocation = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: foreignSessionOwner,
    isolated_authenticated_external_execution_authorization:
      foreignOwnerAuthorization,
  }).invoke(foreignOwnerRequest, controlV01([]));
  const foreignOwnerResult = await foreignOwnerInvocation.result;
  await foreignOwnerInvocation.settled;
  assert.equal(foreignOwnerResult.outcome, "failed");
  assert.equal(
    foreignOwnerResult.public_stop_reason,
    "codex_isolated_auth_external_execution_authorization_refused",
  );
  assert.equal(
    receivedMethodsV01(foreignSessionTrace).includes("thread/start"),
    false,
  );
  assert.equal(readdirSync(foreignSessionState).length, 0);
  foreignAuthorizationOwner.cleanupV01();

  const wrongRootOwner = ownerV01(
    roots,
    "execution-gate-wrong-root-factory",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
  );
  const wrongRootRequest = requestV01(roots.repository, "wrong-root-factory");
  wrongRootRequest.root_scope.canonical_root = roots.ordinaryHome;
  assert.throws(
    () =>
      createCodexIsolatedAuthTestExecutionAuthorizationV01({
        owner: wrongRootOwner,
        request: wrongRootRequest,
        external_authorization_ref: refV01(
          "codex_isolated_auth_test_execution_authorization",
          "test-execution:wrong-root-factory",
        ),
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_repository_root_mismatch",
  );
  wrongRootOwner.cleanupV01();

  const productionRefusalOwner = ownerV01(
    roots,
    "execution-gate-production-refusal",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
  );
  const priorTestMode = process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  delete process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  try {
    assert.throws(
      () =>
        createCodexIsolatedAuthTestExecutionAuthorizationV01({
          owner: productionRefusalOwner,
          request: requestV01(
            roots.repository,
            "execution-gate-production-refusal",
          ),
          external_authorization_ref: refV01(
            "codex_isolated_auth_test_execution_authorization",
            "test-execution:production-refusal",
          ),
          expires_at: EXPIRES_AT,
        }),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code ===
          "codex_isolated_auth_test_execution_authorization_refused",
    );
  } finally {
    restoreEnvV01("AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE", priorTestMode);
    productionRefusalOwner.cleanupV01();
  }

  const authorized = await runProbeV01(
    roots,
    "execution-gate-authorized-once",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
  );
  assert.equal(authorized.result?.outcome, "completed");
  const firstMethods = receivedMethodsV01(authorized.trace_path);
  assert.equal(firstMethods.filter((value) => value === "thread/start").length, 1);
  assert.equal(firstMethods.filter((value) => value === "turn/start").length, 1);
  const modelDrift = await runProbeV01(
    roots,
    "execution-gate-model-drift",
    provisioned,
    FAKE_JWT,
    "isolated_auth_model_configuration_drift",
  );
  assert.equal(modelDrift.result?.outcome, "failed");
  assert.equal(
    modelDrift.result?.public_stop_reason,
    "codex_isolated_auth_external_execution_authorization_refused",
  );
  assert.equal(
    receivedMethodsV01(modelDrift.trace_path).includes("thread/start"),
    false,
  );
  const replayAdapter = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: authorized.owner,
    isolated_authenticated_external_execution_authorization:
      authorized.execution_authorization as
        CodexIsolatedAuthTestExecutionAuthorizationV01,
  });
  const replay = replayAdapter.invoke(authorized.request, controlV01([]));
  const replayResult = await replay.result;
  await replay.settled;
  assert.equal(replayResult.outcome, "failed");
  assert.equal(
    replayResult.public_stop_reason,
    "codex_isolated_auth_owner_single_use_refused",
  );
  assert.deepEqual(receivedMethodsV01(authorized.trace_path), firstMethods);

  return {
    no_authorization_stop:
      "codex_isolated_auth_external_execution_authorization_required",
    unsupported_production_authority: "refused_before_turn",
    authorized_fake_turn: "completed_once",
  };
}

async function agentIdentityClaimNegativesV01(
  roots: RootsV01,
): Promise<void> {
  const withoutEmail = { ...BASE_CLAIMS, account_id: RAW_ACCOUNT_ID, chatgpt_user_id: RAW_USER_ID };
  const emailAbsentProjection = await provisionV01(
    roots,
    "claim-email-absent",
    jwtV01(withoutEmail, "email-absent-signature"),
  );
  assert.match(
    emailAbsentProjection.credential_attestation.account_identity_fingerprint,
    /^sha256:/u,
  );

  const omit = (key: string): Record<string, unknown> => {
    const value: Record<string, unknown> = {
      ...BASE_CLAIMS,
      account_id: RAW_ACCOUNT_ID,
      chatgpt_user_id: RAW_USER_ID,
    };
    delete value[key];
    return value;
  };
  const invalid: Array<[string, string]> = [
    ["wrong-issuer", jwtV01({ ...omit("iss"), iss: "https://example.invalid" }, "sig")],
    ["missing-issuer", jwtV01(omit("iss"), "sig")],
    ["wrong-audience", jwtV01({ ...omit("aud"), aud: "foreign" }, "sig")],
    ["missing-audience", jwtV01(omit("aud"), "sig")],
    ["alg-none", jwtV01(omit("email"), "sig", { alg: "none" })],
    ["alg-es256", jwtV01(omit("email"), "sig", { alg: "ES256" })],
    ["missing-kid", jwtV01(omit("email"), "sig", { kid: undefined })],
    ["missing-runtime", jwtV01(omit("agent_runtime_id"), "sig")],
    ["missing-private-key", jwtV01(omit("agent_private_key"), "sig")],
    ["missing-account", jwtV01(omit("account_id"), "sig")],
    ["missing-user", jwtV01(omit("chatgpt_user_id"), "sig")],
    [
      "wrong-fedramp-name",
      jwtV01(
        {
          ...omit("chatgpt_account_is_fedramp"),
          fedramp: false,
        },
        "sig",
      ),
    ],
    [
      "wrong-fedramp-type",
      jwtV01(
        { ...omit("chatgpt_account_is_fedramp"), chatgpt_account_is_fedramp: "false" },
        "sig",
      ),
    ],
    ["invalid-plan", jwtV01({ ...omit("plan_type"), plan_type: "" }, "sig")],
    [
      "future-iat",
      jwtV01(
        { ...omit("iat"), iat: 4_000_000_000, exp: 4_102_444_800 },
        "sig",
      ),
    ],
    [
      "expired",
      jwtV01({ ...omit("iat"), iat: 1_600_000_000, exp: 1_700_000_000 }, "sig"),
    ],
    [
      "legacy-invented-claims",
      jwtV01(
        {
          ...omit("email"),
          task_id: "legacy-task",
          sub: "legacy-sub",
          provider: "openai",
          environment: "production",
          fedramp: false,
        },
        "sig",
      ),
    ],
  ];
  for (const [id, material] of invalid) {
    const availability = await brokerV01(roots, material, "jwt").availabilityV01({
      codex_executable_fingerprint: sha256FileV01(process.execPath),
      observed_at: GENERATED_AT,
    });
    assert.notEqual(availability.state, "available_exact", id);
  }

  await assert.rejects(
    () =>
      brokerV01(roots, FAKE_JWT, "jwt").provisionCredentialAttestationV01({
        provisioning_binding_ref: refV01(
          "codex_auth_provisioning_binding",
          "provisioning:expiry-overrun",
        ),
        ...semanticProfileBindingV01(),
        attestation_id: "jwt-task-registration-gate",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code ===
        "codex_auth_broker_agent_identity_task_registration_required",
  );

}

async function brokerAndProvisioningNegativesV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<void> {
  const binding = bindingV01();
  const forgedBroker: CodexCredentialBrokerV01 = {
    binding_fingerprint: credentialBrokerBindingFingerprintV01(binding),
    async availabilityV01() {
      throw new Error("forged broker must remain unreachable");
    },
    async provisionCredentialAttestationV01() {
      throw new Error("forged broker must remain unreachable");
    },
  };
  const forgedProviderRef = refV01("model_provider", "openai");
  const forgedAuthorization = createCodexIsolatedAuthProvisioningBindingV01({
    binding_id: "provisioning:forged-broker",
    auth_handle_ref: binding.auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(binding),
    provider_ref: forgedProviderRef,
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  await assert.rejects(
    () =>
      provisionCodexIsolatedAuthProjectionV01({
        projection_id: "codex-isolated-auth:forged-broker",
        provisioning_binding: forgedAuthorization,
        provisioning_binding_ref: refV01(
          "codex_auth_provisioning_binding",
          "provisioning:forged-broker",
        ),
        provider_ref: forgedProviderRef,
        broker_binding: binding,
        broker: forgedBroker,
        codex_executable_ref: refV01("codex_executable", "node-test-host"),
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        executable_identity_class: "test_emulated_profile",
        compatible_codex_cli_version:
          CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_source_owner_mismatch",
  );
  const clonedAuthorization = structuredClone(forgedAuthorization);
  await assert.rejects(
    () =>
      provisionCodexIsolatedAuthProjectionV01({
        projection_id: "codex-isolated-auth:forged-authorization",
        provisioning_binding: clonedAuthorization,
        provisioning_binding_ref: refV01(
          "codex_auth_provisioning_binding",
          clonedAuthorization.binding_id,
        ),
        provider_ref: forgedProviderRef,
        broker_binding: binding,
        broker: brokerV01(roots, FAKE_JWT),
        codex_executable_ref: refV01("codex_executable", "node-test-host"),
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        executable_identity_class: "test_emulated_profile",
        compatible_codex_cli_version:
          CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_provisioning_binding_refused",
  );

  const productionLocator = {
    backend: "macos_keychain_generic_password",
    source_codex_home: roots.ordinaryHome,
    keychain_path: path.join(roots.root, "never-read.keychain-db"),
  } as const;
  const productionBroker = createMacOsKeychainCodexAuthBrokerV01({
    binding: {
      ...binding,
      broker_locator_fingerprint:
        fingerprintBrokerLocatorV01(productionLocator),
    },
    source_codex_home: productionLocator.source_codex_home,
    keychain_path: productionLocator.keychain_path,
  });
  await assert.rejects(
    () =>
      productionBroker.provisionCredentialAttestationV01({
        provisioning_binding_ref: refV01(
          "provisioning_binding",
          "provisioning:production-forbidden-in-test",
        ),
        ...semanticProfileBindingV01(),
        attestation_id: "production-forbidden-in-test",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_production_broker_forbidden_in_test_mode",
  );

  const fakeOutsideTest = brokerV01(roots, FAKE_JWT);
  const priorTestMode = process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  delete process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  try {
    await assert.rejects(
      () =>
        fakeOutsideTest.provisionCredentialAttestationV01({
          provisioning_binding_ref: refV01(
            "provisioning_binding",
            "provisioning:fake-forbidden-outside-test",
          ),
          ...semanticProfileBindingV01(),
          attestation_id: "fake-forbidden-outside-test",
          issued_at: GENERATED_AT,
          expires_at: EXPIRES_AT,
        }),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_fake_broker_forbidden_outside_test_mode",
    );
  } finally {
    restoreEnvV01("AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE", priorTestMode);
  }

  assert.throws(
    () =>
      createFakeCodexCredentialBrokerV01({
        binding,
        lease_root: roots.lease,
        entries: [
          {
            handle_external_id: binding.auth_handle_ref.external_id,
            material: officialAgentIdentityJwtStorageV01(FAKE_JWT),
          },
          {
            handle_external_id: binding.auth_handle_ref.external_id,
            material: officialAgentIdentityJwtStorageV01(OTHER_ACCOUNT_JWT),
          },
        ],
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_handle_duplicate",
  );
  const missing = createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: roots.lease,
    entries: [],
  });
  const availability = await missing.availabilityV01({
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    observed_at: GENERATED_AT,
  });
  assert.equal(availability.state, "handle_missing");
  await assert.rejects(
    () =>
      missing.provisionCredentialAttestationV01({
        provisioning_binding_ref: refV01(
          "provisioning_binding",
          "provisioning:missing",
        ),
        ...semanticProfileBindingV01(),
        attestation_id: "missing",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_handle_missing",
  );

  const incomplete = brokerV01(roots, PARTIAL_ID_JWT, "jwt");
  const incompleteAvailability = await incomplete.availabilityV01({
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    observed_at: GENERATED_AT,
  });
  assert.equal(incompleteAvailability.state, "credential_shape_invalid");

  const other = await provisionV01(roots, "other-account", OTHER_ACCOUNT_JWT);
  assert.notEqual(
    other.credential_attestation.account_identity_fingerprint,
    provisioned.credential_attestation.account_identity_fingerprint,
    "same plan, different stable account must remain distinct",
  );
  const changedAccount = await provisionV01(
    roots,
    "changed-account-id",
    CHANGED_ACCOUNT_ID_JWT,
  );
  const changedUser = await provisionV01(
    roots,
    "changed-user-id",
    CHANGED_USER_ID_JWT,
  );
  assert.notEqual(
    changedAccount.credential_attestation.account_identity_fingerprint,
    provisioned.credential_attestation.account_identity_fingerprint,
  );
  assert.notEqual(
    changedUser.credential_attestation.account_identity_fingerprint,
    provisioned.credential_attestation.account_identity_fingerprint,
  );
  const substitutedOwner = ownerV01(
    roots,
    "substituted-account",
    provisioned,
    OTHER_ACCOUNT_JWT,
    "isolated_auth_success",
  );
  await assert.rejects(
    () =>
      substitutedOwner.startAuthenticatedPreflightV01(),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      (error.code === "codex_auth_broker_generation_mismatch" ||
        error.code === "codex_auth_broker_account_identity_mismatch"),
  );
  assert.equal(
    readdirSync(path.join(roots.state, "substituted-account")).length,
    0,
  );

  const mutatedProjection = structuredClone(provisioned.projection);
  mutatedProjection.account_identity_fingerprint =
    other.projection.account_identity_fingerprint;
  const { integrity: _integrity, ...material } = mutatedProjection;
  mutatedProjection.integrity = {
    algorithm: "sha256",
    fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  };
  assert.throws(
    () =>
      assertValidCodexIsolatedAuthProjectionV01(
        mutatedProjection,
        provisioned.credential_attestation,
        provisioned.projection_seal,
      ),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_attestation_binding_mismatch",
  );

  let release!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  let entered!: () => void;
  const enteredPromise = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const collisionBroker = createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material: officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
      },
    ],
    before_return: async () => {
      entered();
      await barrier;
    },
  });
  const first = collisionBroker.provisionCredentialAttestationV01({
    provisioning_binding_ref: refV01(
      "provisioning_binding",
      "provisioning:collision",
    ),
    ...semanticProfileBindingV01(),
    attestation_id: "collision-one",
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  await enteredPromise;
  await assert.rejects(
    () =>
      collisionBroker.provisionCredentialAttestationV01({
        provisioning_binding_ref: refV01(
          "provisioning_binding",
          "provisioning:collision",
        ),
        ...semanticProfileBindingV01(),
        attestation_id: "collision-two",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_lease_collision",
  );
  release();
  await first;
}

async function runtimePolicyNegativesV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<void> {
  for (const [id, scenario, reason] of [
    [
      "mode-fallback",
      "isolated_auth_mode_fallback",
      "codex_isolated_auth_mode_mismatch",
    ],
    [
      "account-switch",
      "isolated_auth_account_mismatch",
      "codex_isolated_auth_account_projection_mismatch",
    ],
    [
      "account-plan-drift",
      "isolated_auth_account_plan_drift",
      "codex_isolated_auth_account_projection_mismatch",
    ],
    [
      "config-drift",
      "isolated_auth_config_mismatch",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "tool-drift",
      "isolated_auth_tool_policy_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "unknown-tool-drift",
      "isolated_auth_unknown_feature_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "mcp-drift",
      "isolated_auth_mcp_drift",
      "codex_isolated_auth_mcp_policy_mismatch",
    ],
    [
      "plugin-drift",
      "isolated_auth_plugin_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "route-drift",
      "isolated_auth_provider_route_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "custom-provider-drift",
      "isolated_auth_custom_provider_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "provider-env-key-drift",
      "isolated_auth_provider_env_key_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "provider-bearer-drift",
      "isolated_auth_provider_bearer_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "provider-auth-drift",
      "isolated_auth_provider_auth_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "provider-aws-drift",
      "isolated_auth_provider_aws_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "provider-headers-drift",
      "isolated_auth_provider_headers_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "managed-layer",
      "isolated_auth_managed_layer_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "sqlite-drift",
      "isolated_auth_sqlite_home_drift",
      "codex_isolated_auth_config_policy_mismatch",
    ],
    [
      "cli-drift",
      "isolated_auth_cli_version_mismatch",
      "codex_app_server_user_agent_cli_version_mismatch",
    ],
    [
      "user-agent-originator",
      "isolated_auth_user_agent_wrong_originator",
      "codex_app_server_user_agent_originator_mismatch",
    ],
    [
      "user-agent-client-version",
      "isolated_auth_user_agent_wrong_client_version",
      "codex_app_server_user_agent_client_version_mismatch",
    ],
    [
      "user-agent-missing-platform",
      "isolated_auth_user_agent_missing_platform",
      "codex_app_server_user_agent_shape_mismatch",
    ],
    [
      "user-agent-malformed-platform",
      "isolated_auth_user_agent_malformed_platform",
      "codex_app_server_user_agent_shape_mismatch",
    ],
    [
      "user-agent-duplicate-identity",
      "isolated_auth_user_agent_duplicate_identity",
      "codex_app_server_user_agent_shape_mismatch",
    ],
    [
      "user-agent-unexpected-suffix",
      "isolated_auth_user_agent_unexpected_suffix",
      "codex_app_server_user_agent_shape_mismatch",
    ],
    [
      "user-agent-over-bound",
      "isolated_auth_user_agent_over_bound",
      "codex_app_server_user_agent_invalid",
    ],
    [
      "user-agent-control",
      "isolated_auth_user_agent_control_character",
      "codex_app_server_user_agent_invalid",
    ],
    [
      "user-agent-legacy",
      "isolated_auth_user_agent_legacy_abbreviated",
      "codex_app_server_user_agent_shape_mismatch",
    ],
  ] as const) {
    const probe = await runProbeV01(roots, id, provisioned, FAKE_JWT, scenario);
    assert.equal(
      probe.result?.outcome,
      "failed",
      `${scenario} must fail before repository work`,
    );
    assert.equal(probe.result?.public_stop_reason, reason);
    assert.equal(
      receivedMethodsV01(probe.trace_path).includes("thread/start"),
      false,
    );
    assert.equal(
      receivedMethodsV01(probe.trace_path).includes("turn/start"),
      false,
    );
    assert.equal(readdirSync(probe.state_parent).length, 0);
  }

  const authRecovery = await runProbeV01(
    roots,
    "auth-recovery-runtime-drift",
    provisioned,
    FAKE_JWT,
    "isolated_auth_auth_recovery_notifications",
  );
  assert.equal(authRecovery.result, null);
  assert.equal(
    errorCodeV01(authRecovery.error),
    "codex_isolated_auth_runtime_policy_drift",
  );
  assert.equal(
    authRecovery.adapter_observations.some((observation) =>
      [
        "provider_auth_recovery_started",
        "provider_auth_recovery_completed",
        "approval_requested",
        "approval_resolved",
      ].includes(observation.kind),
    ),
    false,
  );
  assert.equal(readdirSync(authRecovery.state_parent).length, 0);
}

async function tmpAndFailureNegativesV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<void> {
  const preSpawnParent = path.join(roots.state, "tmp-pre-spawn-substitution");
  const preSpawnOwner = ownerV01(
    roots,
    "tmp-pre-spawn-substitution",
    provisioned,
    FAKE_JWT,
    "isolated_auth_success",
    preSpawnParent,
  );
  const attemptRoot = path.join(
    preSpawnParent,
    readdirSync(preSpawnParent)[0]!,
  );
  const ownedTmp = path.join(attemptRoot, "tmp");
  rmSync(ownedTmp, { recursive: true, force: false });
  symlinkSync(roots.ordinaryTmp, ownedTmp);
  await assert.rejects(
    () =>
      preSpawnOwner.startAuthenticatedPreflightV01(),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_state_substituted",
  );
  assert.equal(readdirSync(roots.lease).length, 0);
  rmSync(attemptRoot, { recursive: true, force: false });

  const malformed = await runProbeV01(
    roots,
    "transport-failure",
    provisioned,
    FAKE_JWT,
    "malformed_json",
  );
  assert.notEqual(malformed.result?.outcome, "completed");
  assert.equal(readdirSync(malformed.state_parent).length, 0);
  assertPublicSafeV01({
    error: errorCodeV01(malformed.error),
    settled: errorCodeV01(malformed.settled_error),
    observations: malformed.adapter_observations,
  });

  const tmpSubstitution = await runProbeV01(
    roots,
    "tmp-substitution",
    provisioned,
    FAKE_JWT,
    "isolated_auth_tmp_substitution",
  );
  assert.equal(tmpSubstitution.settled_error instanceof Error, true);
  assert.match(
    (tmpSubstitution.settled_error as Error).message,
    /codex_isolated_auth_state_substituted/u,
  );

  const failedBroker = createFakeCodexCredentialBrokerV01({
    binding: bindingV01(),
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: bindingV01().auth_handle_ref.external_id,
        material: officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
      },
    ],
    fail_code: "codex_auth_broker_lookup_failed",
  });
  const stateParent = path.join(roots.state, "broker-failure");
  mkdirSync(stateParent, { mode: 0o700 });
  const failedOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: provisioned.projection,
    credential_attestation: provisioned.credential_attestation,
    projection_seal: provisioned.projection_seal,
    broker: failedBroker,
    state_parent: stateParent,
    repository_root: roots.repository,
    command: process.execPath,
    prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    base_environment: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      TMPDIR: roots.ordinaryTmp,
    },
  });
  await assert.rejects(
    () =>
      failedOwner.startAuthenticatedPreflightV01(),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_lookup_failed",
  );
  assert.equal(
    readdirSync(stateParent).length,
    0,
    "spawn failure must remove the complete attempt including tmp",
  );
}

async function leaseReleaseRollbackV01(
  roots: RootsV01,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
): Promise<void> {
  const rollbackRoot = path.join(roots.runtime, "lease-release-rollback");
  const leaseRoot = path.join(rollbackRoot, "lease");
  const stateParent = path.join(rollbackRoot, "state");
  const boundaryPath = path.join(rollbackRoot, "auth-boundary.json");
  mkdirSync(leaseRoot, { recursive: true, mode: 0o700 });
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  const binding = bindingV01();
  const broker = createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: leaseRoot,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material: officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
      },
    ],
    after_spawn_before_lease_release: async () => {
      for (let attempt = 0; attempt < 100 && !existsSync(boundaryPath); attempt += 1)
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      assert.equal(existsSync(boundaryPath), true, "authenticated child must start before forced lease substitution");
      const lease = readdirSync(leaseRoot).find((entry) => entry.endsWith(".lease"));
      assert.ok(lease);
      unlinkSync(path.join(leaseRoot, lease));
    },
  });
  const owner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: provisioned.projection,
    credential_attestation: provisioned.credential_attestation,
    projection_seal: provisioned.projection_seal,
    broker,
    state_parent: stateParent,
    repository_root: roots.repository,
    command: process.execPath,
    prefix_args: [
      path.join(process.cwd(), "scripts", "fixtures", "fake-codex-app-server.mjs"),
    ],
    base_environment: { NODE_ENV: "test", PATH: process.env.PATH },
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: "isolated_auth_success",
      FAKE_CODEX_AUTH_BOUNDARY_PATH: boundaryPath,
    },
  });
  const unrelated = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    shell: false,
    stdio: "ignore",
  });
  try {
    await assert.rejects(
      () => owner.startAuthenticatedPreflightV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_lease_substituted",
    );
    assert.equal(readdirSync(stateParent).length, 0);
    assert.equal(
      readdirSync(leaseRoot).some((entry) => entry.endsWith(".poisoned")),
      true,
      "ambiguous post-spawn lease release must leave a fail-closed tombstone",
    );
    assert.doesNotThrow(() => process.kill(unrelated.pid!, 0));
    const replayState = path.join(rollbackRoot, "replay-state");
    mkdirSync(replayState, { mode: 0o700 });
    const replayBroker = createFakeCodexCredentialBrokerV01({
      binding,
      lease_root: leaseRoot,
      entries: [
        {
          handle_external_id: binding.auth_handle_ref.external_id,
          material: officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
        },
      ],
    });
    const replayOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
      projection: provisioned.projection,
      credential_attestation: provisioned.credential_attestation,
      projection_seal: provisioned.projection_seal,
      broker: replayBroker,
      state_parent: replayState,
      repository_root: roots.repository,
      command: process.execPath,
      prefix_args: [
        path.join(process.cwd(), "scripts", "fixtures", "fake-codex-app-server.mjs"),
      ],
      base_environment: { NODE_ENV: "test", PATH: process.env.PATH },
      test_environment: {
        AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
        FAKE_CODEX_SCENARIO: "isolated_auth_success",
      },
    });
    await assert.rejects(
      () => replayOwner.startAuthenticatedPreflightV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_lease_collision",
    );
    assert.equal(readdirSync(replayState).length, 0);
    assertPublicSafeV01({
      rollback_error: "codex_auth_broker_lease_substituted",
      replay_error: "codex_auth_broker_lease_collision",
      child_handle_returned: false,
      cleanup_complete: true,
    });
  } finally {
    await stopTestOwnedChildV01(unrelated);
    rmSync(rollbackRoot, { recursive: true, force: true });
  }

  const timeoutRoot = path.join(roots.runtime, "rollback-timeout-classification");
  const timeoutLease = path.join(timeoutRoot, "lease");
  const timeoutState = path.join(timeoutRoot, "state");
  const timeoutTrace = path.join(timeoutRoot, "trace.jsonl");
  mkdirSync(timeoutLease, { recursive: true, mode: 0o700 });
  mkdirSync(timeoutState, { recursive: true, mode: 0o700 });
  const timeoutBroker = createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: timeoutLease,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material: officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
      },
    ],
    after_spawn_before_lease_release: async () => {
      for (
        let attempt = 0;
        attempt < 100 &&
        (!existsSync(timeoutTrace) ||
          !readFileSync(timeoutTrace, "utf8").includes(
            "sigterm_handler_ready_for_isolated_auth_rollback_test",
          ));
        attempt += 1
      )
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      assert.equal(
        readFileSync(timeoutTrace, "utf8").includes(
          "sigterm_handler_ready_for_isolated_auth_rollback_test",
        ),
        true,
      );
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_test_post_spawn_failure",
      );
    },
    force_rollback_unsettled_for_test: true,
    force_persistent_rollback_unsettled_for_test: true,
  });
  const timeoutOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: provisioned.projection,
    credential_attestation: provisioned.credential_attestation,
    projection_seal: provisioned.projection_seal,
    broker: timeoutBroker,
    state_parent: timeoutState,
    repository_root: roots.repository,
    command: process.execPath,
    prefix_args: [
      path.join(process.cwd(), "scripts", "fixtures", "fake-codex-app-server.mjs"),
    ],
    base_environment: { NODE_ENV: "test", PATH: process.env.PATH },
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: "isolated_auth_ignore_sigterm",
      FAKE_CODEX_TRACE_PATH: timeoutTrace,
    },
  });
  try {
    await assert.rejects(
      () => timeoutOwner.startAuthenticatedPreflightV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_child_rollback_incomplete",
    );
    assert.throws(
      () => timeoutOwner.cleanupV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_child_rollback_retained",
    );
    const cleanupDeadline = Date.now() + 6_000;
    while (readdirSync(timeoutState).length !== 0 && Date.now() < cleanupDeadline)
      await new Promise<void>((resolve) => setTimeout(resolve, 25));
    assert.equal(readdirSync(timeoutState).length, 0);
    assert.equal(
      readdirSync(timeoutLease).filter((entry) => entry.endsWith(".poisoned"))
        .length,
      1,
    );
    const timeoutReplayState = path.join(timeoutRoot, "replay-state");
    mkdirSync(timeoutReplayState, { recursive: true, mode: 0o700 });
    const timeoutReplayOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
      ...ownerInputV01(
        roots,
        "timeout-replay-owner",
        provisioned,
        FAKE_JWT,
        "isolated_auth_success",
        timeoutReplayState,
      ),
      broker: createFakeCodexCredentialBrokerV01({
        binding,
        lease_root: timeoutLease,
        entries: [
          {
            handle_external_id: binding.auth_handle_ref.external_id,
            material: officialInitializedAgentIdentityRecordStorageV01(FAKE_JWT),
          },
        ],
      }),
    });
    await assert.rejects(
      () => timeoutReplayOwner.startAuthenticatedPreflightV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_lease_collision",
    );
    assert.equal(readdirSync(timeoutReplayState).length, 0);
  } finally {
    rmSync(timeoutRoot, { recursive: true, force: true });
  }
}

async function exactProcessBirthRollbackV01(): Promise<void> {
  const child = spawn(
    process.execPath,
    ["-e", "setInterval(() => {}, 1000)"],
    { stdio: "ignore", windowsHide: true },
  );
  const unrelated = spawn(
    process.execPath,
    ["-e", "setInterval(() => {}, 1000)"],
    { stdio: "ignore", windowsHide: true },
  );
  try {
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        unrelated.once("spawn", resolve);
        unrelated.once("error", reject);
      }),
    ]);
    const refused =
      await verifyCodexBrokerProcessIdentitySubstitutionForTestV01(child);
    assert.equal(refused.ownership_exact, false);
    assert.equal(refused.settled, false);
    assert.doesNotThrow(() => process.kill(child.pid!, 0));
    assert.doesNotThrow(() => process.kill(unrelated.pid!, 0));
  } finally {
    await Promise.all([
      stopTestOwnedChildV01(child),
      stopTestOwnedChildV01(unrelated),
    ]);
  }
}

async function poisonWriteFailureReplayV01(roots: RootsV01): Promise<void> {
  const provisioned = await provisionV01(
    roots,
    "poison-write-failure",
    POISON_FAILURE_JWT,
  );
  const root = path.join(roots.runtime, "poison-write-failure");
  const leaseRoot = path.join(root, "lease");
  const stateParent = path.join(root, "state");
  const tracePath = path.join(root, "trace.jsonl");
  mkdirSync(leaseRoot, { recursive: true, mode: 0o700 });
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  const binding = bindingV01();
  const broker = createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: leaseRoot,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material:
          officialInitializedAgentIdentityRecordStorageV01(POISON_FAILURE_JWT),
      },
    ],
    after_spawn_before_lease_release: async () => {
      for (
        let attempt = 0;
        attempt < 100 &&
        (!existsSync(tracePath) ||
          !readFileSync(tracePath, "utf8").includes(
            "sigterm_handler_ready_for_isolated_auth_rollback_test",
          ));
        attempt += 1
      )
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_test_post_spawn_failure",
      );
    },
    force_persistent_rollback_unsettled_for_test: true,
    force_poison_write_failure_for_test: true,
  });
  const owner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    ...ownerInputV01(
      roots,
      "poison-write-failure-owner",
      provisioned,
      POISON_FAILURE_JWT,
      "isolated_auth_ignore_sigterm",
      stateParent,
    ),
    broker,
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: "isolated_auth_ignore_sigterm",
      FAKE_CODEX_TRACE_PATH: tracePath,
    },
  });
  try {
    await assert.rejects(
      () => owner.startAuthenticatedPreflightV01(),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_child_rollback_incomplete",
    );
    assert.equal(
      readdirSync(leaseRoot).filter((entry) => entry.endsWith(".lease")).length,
      1,
      "poison write failure must retain the original exclusive lease",
    );
    const assertReplayRefused = async (id: string): Promise<void> => {
      const replayState = path.join(root, id);
      mkdirSync(replayState, { recursive: true, mode: 0o700 });
      const replayOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
        ...ownerInputV01(
          roots,
          id,
          provisioned,
          POISON_FAILURE_JWT,
          "isolated_auth_success",
          replayState,
        ),
        broker: createFakeCodexCredentialBrokerV01({
          binding,
          lease_root: leaseRoot,
          entries: [
            {
              handle_external_id: binding.auth_handle_ref.external_id,
              material:
                officialInitializedAgentIdentityRecordStorageV01(
                  POISON_FAILURE_JWT,
                ),
            },
          ],
        }),
      });
      await assert.rejects(
        () => replayOwner.startAuthenticatedPreflightV01(),
        (error: unknown) =>
          error instanceof CodexCredentialBrokerErrorV01 &&
          error.code === "codex_auth_broker_lease_collision",
      );
      assert.equal(readdirSync(replayState).length, 0);
    };
    await assertReplayRefused("replay-original-root");
    rmSync(leaseRoot, { recursive: true, force: true });
    mkdirSync(leaseRoot, { recursive: true, mode: 0o700 });
    await assertReplayRefused("replay-substituted-root");
    const cleanupDeadline = Date.now() + 6_000;
    while (readdirSync(stateParent).length !== 0 && Date.now() < cleanupDeadline)
      await new Promise<void>((resolve) => setTimeout(resolve, 25));
    assert.equal(readdirSync(stateParent).length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function provisionV01(
  roots: RootsV01,
  id: string,
  jwt: string,
): Promise<ProvisionCodexIsolatedAuthProjectionResultV01> {
  const binding = bindingV01();
  const providerRef = refV01("model_provider", "openai");
  const authorization = createCodexIsolatedAuthProvisioningBindingV01({
    binding_id: `provisioning:${id}`,
    auth_handle_ref: binding.auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(binding),
    provider_ref: providerRef,
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  return await provisionCodexIsolatedAuthProjectionV01({
    projection_id: `codex-isolated-auth:${id}`,
    provisioning_binding: authorization,
    provisioning_binding_ref: refV01(
      "codex_auth_provisioning_binding",
      `provisioning:${id}`,
    ),
    provider_ref: providerRef,
    broker_binding: binding,
    broker: brokerV01(roots, jwt),
    codex_executable_ref: refV01("codex_executable", "node-test-host"),
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
}

function bindingV01(): CodexCredentialBrokerBindingV01 {
  const binding = {
    auth_handle_ref: refV01("opaque_auth_handle", "codex-auth-handle:fixture"),
    broker_backend_ref: refV01(
      "auth_broker_backend",
      "macos-keychain-generic-password",
    ),
    broker_executable_ref: refV01(
      "auth_broker_executable",
      "security-system-binary",
    ),
    broker_executable_fingerprint: `sha256:${"b".repeat(64)}`,
    broker_locator_fingerprint: `sha256:${"c".repeat(64)}`,
  };
  assert.match(credentialBrokerBindingFingerprintV01(binding), /^sha256:/u);
  return binding;
}
function semanticProfileBindingV01() {
  return {
    semantic_profile_version:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
  } as const;
}
function brokerV01(
  roots: RootsV01,
  jwt: string,
  storage: "initialized_record" | "jwt" = "initialized_record",
): CodexCredentialBrokerV01 {
  const binding = bindingV01();
  return createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material:
          storage === "jwt"
            ? officialAgentIdentityJwtStorageV01(jwt)
            : officialInitializedAgentIdentityRecordStorageV01(jwt),
      },
    ],
  });
}

function initializedAgentIdentityRecordFromJwtFixtureV01(
  jwt: string,
): Record<string, unknown> {
  const payload = JSON.parse(
    Buffer.from(jwt.split(".")[1]!, "base64url").toString("utf8"),
  ) as Record<string, unknown>;
  return {
    agent_runtime_id: payload.agent_runtime_id,
    agent_private_key: payload.agent_private_key,
    account_id: payload.account_id,
    chatgpt_user_id: payload.chatgpt_user_id,
    ...(typeof payload.email === "string" ? { email: payload.email } : {}),
    plan_type: payload.plan_type,
    chatgpt_account_is_fedramp: payload.chatgpt_account_is_fedramp,
    task_id: "fixture-agent-task",
  };
}

function officialInitializedAgentIdentityRecordStorageV01(jwt: string): string {
  return officialAgentIdentityRecordStorageV01(
    initializedAgentIdentityRecordFromJwtFixtureV01(jwt),
  );
}
function ownerV01(
  roots: RootsV01,
  id: string,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
  jwt: string,
  scenario: string,
  stateParent?: string,
): CodexIsolatedAuthenticatedExecutionOwnerV01 {
  return new CodexIsolatedAuthenticatedExecutionOwnerV01(
    ownerInputV01(roots, id, provisioned, jwt, scenario, stateParent),
  );
}

function ownerInputV01(
  roots: RootsV01,
  id: string,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
  jwt: string,
  scenario: string,
  stateParent?: string,
): ConstructorParameters<typeof CodexIsolatedAuthenticatedExecutionOwnerV01>[0] {
  const parent = stateParent ?? path.join(roots.state, id);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  return {
    projection: provisioned.projection,
    credential_attestation: provisioned.credential_attestation,
    projection_seal: provisioned.projection_seal,
    broker: brokerV01(roots, jwt),
    state_parent: parent,
    repository_root: roots.repository,
    command: process.execPath,
    prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    base_environment: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      TMPDIR: roots.ordinaryTmp,
      LANG: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: scenario,
    },
  };
}

async function runProbeV01(
  roots: RootsV01,
  id: string,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
  jwt: string,
  scenario: string,
  executionAuthorization: ExecutionAuthorizationVariantV01 = "test_authorized",
): Promise<ProbeV01> {
  const stateParent = path.join(roots.state, id);
  const runRoot = path.join(roots.runtime, id);
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  mkdirSync(runRoot, { recursive: true, mode: 0o700 });
  const boundaryPath = path.join(runRoot, "auth-boundary.json");
  const networkPath = path.join(runRoot, "network-count.txt");
  const cleanupPath = path.join(runRoot, "cleanup.marker");
  const tracePath = path.join(runRoot, "app-server-trace.jsonl");
  const owner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: provisioned.projection,
    credential_attestation: provisioned.credential_attestation,
    projection_seal: provisioned.projection_seal,
    broker: brokerV01(roots, jwt),
    state_parent: stateParent,
    repository_root: roots.repository,
    command: process.execPath,
    prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    base_environment: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      TMPDIR: roots.ordinaryTmp,
      LANG: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: scenario,
      FAKE_CODEX_AUTH_BOUNDARY_PATH: boundaryPath,
      FAKE_CODEX_NETWORK_COUNT_PATH: networkPath,
      FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupPath,
      FAKE_CODEX_TRACE_PATH: tracePath,
    },
  });
  assertNoSecretApiV01(owner);
  const request = requestV01(roots.repository, id);
  const authorizationRequest = structuredClone(request);
  if (executionAuthorization === "wrong_request")
    authorizationRequest.request_id = `${request.request_id}:foreign`;
  if (executionAuthorization === "wrong_run")
    authorizationRequest.run_id = `${request.run_id}:foreign`;
  let externalExecutionAuthorization:
    | PresentedExternalExecutionAuthorizationV01
    | undefined;
  if (executionAuthorization === "unsupported_production") {
    externalExecutionAuthorization = unsupportedProductionExecutionAuthorizationV01({
      owner,
      request,
      observed_at: GENERATED_AT,
      expires_at: EXPIRES_AT,
    });
  } else if (executionAuthorization !== "absent") {
    externalExecutionAuthorization =
      createCodexIsolatedAuthTestExecutionAuthorizationV01({
        owner,
        request: authorizationRequest,
        external_authorization_ref: refV01(
          "codex_isolated_auth_test_execution_authorization",
          `test-execution:${id}`,
        ),
        expires_at:
          executionAuthorization === "expired"
            ? "2025-01-01T00:00:00.000Z"
            : EXPIRES_AT,
      });
    const substitutions: Partial<CodexIsolatedAuthTestExecutionAuthorizationV01> =
      executionAuthorization === "substituted_root"
        ? { root_scope_fingerprint: `sha256:${"0".repeat(64)}` }
        : executionAuthorization === "substituted_projection"
        ? { projection_fingerprint: `sha256:${"1".repeat(64)}` }
        : executionAuthorization === "substituted_environment"
          ? { execution_environment_fingerprint: `sha256:${"2".repeat(64)}` }
          : executionAuthorization === "substituted_provider"
            ? { provider_ref: refV01("model_provider", "foreign-provider") }
            : executionAuthorization === "substituted_route"
              ? { effective_route_fingerprint: `sha256:${"3".repeat(64)}` }
              : executionAuthorization === "substituted_model"
                ? {
                    model_configuration_ref: refV01(
                      "model_configuration",
                      "foreign-model-configuration",
                    ),
                  }
              : executionAuthorization === "substituted_ordinal"
                ? { invocation_ordinal: 2 as 1 }
                : executionAuthorization === "substituted_ceiling"
                  ? {
                      provider_model_bearing_invocation_ceiling: 0 as 1,
                    }
                : executionAuthorization === "substituted_fallback"
                  ? { no_fallback: false as true }
                  : {};
    if (
      executionAuthorization === "cloned" ||
      Object.keys(substitutions).length > 0
    ) {
      const substituted = {
        ...structuredClone(externalExecutionAuthorization),
        ...substitutions,
      } as CodexIsolatedAuthTestExecutionAuthorizationV01;
      const { integrity: _integrity, ...material } = substituted;
      externalExecutionAuthorization = Object.freeze({
        ...material,
        integrity: {
          algorithm: "sha256",
          fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(material),
          ),
        },
      }) as CodexIsolatedAuthTestExecutionAuthorizationV01;
    }
  }
  const lifecycle: NativeHostLifecycleEventV01[] = [];
  const adapterObservations: CodexAppServerAdapterObservationV01[] = [];
  const authObservations: CodexIsolatedAuthObservationV01[] = [];
  const adapter = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: owner,
    ...(externalExecutionAuthorization
      ? {
          isolated_authenticated_external_execution_authorization:
            externalExecutionAuthorization as
              CodexIsolatedAuthTestExecutionAuthorizationV01,
        }
      : {}),
    observe: (value) => adapterObservations.push(value),
    observe_isolated_auth: (value) => authObservations.push(value),
  });
  const invocation = adapter.invoke(
    request,
    controlV01(lifecycle),
  );
  let result: NativeHostResultV01 | null = null;
  let error: unknown = null;
  let settledError: unknown = null;
  try {
    result = await invocation.result;
  } catch (caught) {
    error = caught;
  }
  try {
    await invocation.settled;
  } catch (caught) {
    settledError = caught;
  }
  return {
    result,
    error,
    settled_error: settledError,
    lifecycle_events: lifecycle,
    adapter_observations: adapterObservations,
    auth_observations: authObservations,
    state_parent: stateParent,
    boundary_path: boundaryPath,
    network_path: networkPath,
    cleanup_path: cleanupPath,
    trace_path: tracePath,
    execution_authorization: externalExecutionAuthorization ?? null,
    owner,
    request,
  };
}

function unsupportedProductionExecutionAuthorizationV01(input: {
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
  observed_at: string;
  expires_at: string;
}): Readonly<Record<string, unknown>> {
  const modelConfigurationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      configuration_version:
        "codex_isolated_auth_test_model_configuration.v0.1",
      model: "fake-isolated-model",
      reasoning_effort: "low",
      provider_route_fingerprint:
        input.owner.projection.config_policy.provider_route_fingerprint,
    }),
  );
  const material = {
    authorization_version: "unsupported_external_execution_authorization.v0.1",
    authorization_kind: "production_external_execution" as const,
    external_authorization_ref: refV01(
      "unsupported_external_execution_authorization",
      "foreign-production-authority",
      input.observed_at,
    ),
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    root_scope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.request.root_scope),
    ),
    projection_fingerprint: input.owner.projection.integrity.fingerprint,
    execution_environment_fingerprint:
      input.owner.execution_environment_fingerprint,
    provider_ref: structuredClone(input.owner.projection.provider_ref),
    model_configuration_ref: refV01(
      "model_configuration",
      `codex-isolated-auth-model-configuration:${modelConfigurationFingerprint}`,
      input.observed_at,
    ),
    effective_route_fingerprint:
      input.owner.projection.config_policy.provider_route_fingerprint,
    invocation_ordinal: 1,
    provider_model_bearing_invocation_ceiling: 1,
    expires_at: input.expires_at,
    no_fallback: true as const,
    single_use: true as const,
    test_only: false as const,
  };
  return Object.freeze({
    ...material,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(material),
      ),
    },
  });
}

function requestV01(repositoryRoot: string, id: string): NativeHostRequestV01 {
  const packet = buildTaskContextPacketV01(
    structuredClone(genericCliBuilderInputFixture),
  );
  const root = realpathSync(repositoryRoot);
  const stat = statSync(root, { bigint: true });
  const rootFingerprint = createProtocolSha256V01(`root:${root}`);
  return {
    request_version: "native_host_request.v0.1",
    request_id: `host-request:${id}`,
    run_id: `host-run:${id}`,
    idempotency_key: createProtocolSha256V01(`idempotency:${id}`),
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: refV01("work", `work:${id}`),
    task_ref: refV01("task", `task:${id}`),
    task_context_packet_ref: refV01("task_context_packet", packet.packet_id),
    packet,
    packet_lineage: {
      source_transition_receipt_ref: refV01(
        "state_transition_receipt",
        `transition:${id}`,
      ),
      packet_source_refs: [],
      selected_context_refs: [],
    },
    mode: "policy_triggered",
    root_scope: {
      canonical_root: root,
      path_flavor: "posix",
      root_kind: "git_repository",
      root_fingerprint: rootFingerprint,
      physical_root_identity: {
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: rootFingerprint,
        device: String(stat.dev),
        inode: String(stat.ino),
      },
      root_scope_ref: refV01("project_root_scope", `scope:${id}`),
      repository_ref: refV01("repository", "hynk-studio/augnes"),
      selected_worktree_ref: null,
    },
    requested_capability: "isolated_authenticated_native_host.v0.1",
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_structured_result",
    ],
    forbidden_operation_categories: [
      "network_egress",
      "external_state_mutation",
    ],
    packet_capability_grant: packet.capability_grant,
    execution_grant_ref: null,
    automation_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "approval_required",
      model: "native_host_managed",
      host_egress: "bounded_capability_grant",
      max_changed_files: 8,
      max_artifacts: 8,
      max_commands: 8,
      max_checks: 16,
      timeout_ms: 10_000,
      stop_settle_timeout_ms: 3_000,
      stop_conditions: ["timeout", "cancellation_requested"],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 128 * 1024,
    },
  };
}
function controlV01(events: NativeHostLifecycleEventV01[]) {
  return {
    cancellation_signal: new AbortController().signal,
    timeout_ms: 10_000,
    stop_settle_timeout_ms: 3_000,
    lifecycle_sink: {
      async report_event(event: NativeHostLifecycleEventV01) {
        events.push(event);
      },
      async request_approval() {
        throw new Error("isolated_auth_unexpected_approval");
      },
    },
    resume_binding: null,
  };
}
function refV01(
  refType: string,
  externalId: string,
  observedAt = GENERATED_AT,
): ExternalRefV01 {
  return createCodexIsolatedAuthTestRefV01({
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
  });
}

function createRootsV01() {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-codex-isolated-auth-"));
  const roots = {
    root,
    repository: path.join(root, "repository"),
    state: path.join(root, "state"),
    lease: path.join(root, "lease"),
    runtime: path.join(root, "runtime"),
    ordinaryHome: path.join(root, "ordinary-home"),
    ordinaryTmp: path.join(root, "ordinary-tmp"),
  };
  for (const directory of Object.values(roots).slice(1))
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  mkdirSync(path.join(roots.repository, ".git"), { mode: 0o700 });
  writeFileSync(
    path.join(roots.ordinaryHome, "foreign-config.toml"),
    "foreign-user-instruction=true\n",
    { mode: 0o600 },
  );
  writeFileSync(
    path.join(roots.ordinaryHome, "foreign-history.jsonl"),
    '{"message":"seeded predecessor and sibling history"}\n',
    { mode: 0o600 },
  );
  writeFileSync(
    path.join(roots.ordinaryTmp, "foreign-temp-canary"),
    "ordinary-temp-untouched\n",
    { mode: 0o600 },
  );
  return roots;
}
function assertNoSecretApiV01(value: unknown): void {
  const text = JSON.stringify(value);
  for (const secret of SECRET_CANARIES)
    assert.equal(text.includes(secret), false);
  const methods = new Set<string>();
  let proto: object | null =
    typeof value === "object" && value ? Object.getPrototypeOf(value) : null;
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach((name) => methods.add(name));
    proto = Object.getPrototypeOf(proto);
  }
  assert.equal(methods.has("withLaunchMaterialV01"), false);
  assert.equal(methods.has("withSpawnMaterialV01"), false);
  assert.equal(methods.has("resolveMaterialV01"), false);
  assert.equal(methods.has("withResolvedMaterialV01"), false);
  assert.equal(methods.has("resolveMaterial"), false);
  assert.equal(Object.hasOwn(value as object, "resolveMaterial"), false);
  assert.equal(
    Object.hasOwn(value as object, "withResolvedMaterialV01"),
    false,
  );
}
function assertNoExecutionTransportSurfaceV01(value: unknown): void {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  const forbidden = new Set([
    "child",
    "stdin",
    "stdout",
    "stderr",
    "write",
    "request",
    "notify",
    "kill",
    "spawnIsolatedCodexAppServerV01",
    "spawnCodexAppServerWithPrivateCapabilityV01",
  ]);
  const reachable = new Set<string>(
    Object.getOwnPropertyNames(value as object),
  );
  let proto = Object.getPrototypeOf(value as object) as object | null;
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach((name) => reachable.add(name));
    proto = Object.getPrototypeOf(proto) as object | null;
  }
  for (const name of forbidden)
    assert.equal(
      reachable.has(name),
      false,
      `public isolated-auth surface exposed ${name}`,
    );
  for (const name of Object.getOwnPropertyNames(value as object)) {
    const member = Reflect.get(value as object, name) as unknown;
    assert.equal(
      member instanceof ChildProcess,
      false,
      `public isolated-auth property ${name} exposed a ChildProcess`,
    );
    assert.equal(
      typeof member === "object" &&
        member !== null &&
        ("writable" in member || "readable" in member),
      false,
      `public isolated-auth property ${name} exposed a process stream`,
    );
  }
}
function assertRuntimeSubstitutionRefusedV01(
  value: object,
  method: string,
): void {
  const prototype = Object.getPrototypeOf(value) as object;
  const original = Reflect.get(value, method);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(prototype), true);
  assert.equal(
    Reflect.set(value, method, async () => {
      throw new Error("runtime substitution must remain unreachable");
    }),
    false,
  );
  assert.equal(
    Reflect.set(prototype, method, async () => {
      throw new Error("prototype substitution must remain unreachable");
    }),
    false,
  );
  assert.equal(Reflect.get(value, method), original);
}
function assertPublicSafeV01(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const secret of SECRET_CANARIES)
    assert.equal(
      serialized.includes(secret),
      false,
      "public material leaked seeded private material",
    );
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error(code) {
        if (
          code !== "provider_specific_core_field" &&
          code !== "secret_shaped_field"
        )
          issues.push(code);
      },
      warning() {},
    },
    {
      secret_material_message: "No secret may escape.",
      provider_specific_field_message: "Provider refs remain typed.",
    },
  );
  assert.deepEqual(issues, []);
}
function assertNoSecretFilesV01(root: string): void {
  for (const file of listFilesV01(root)) {
    const text = readFileSync(file, "utf8");
    for (const secret of SECRET_CANARIES)
      assert.equal(text.includes(secret), false, `secret leaked into ${file}`);
    const privateRootTraceKinds = text
      .split("\n")
      .filter((line) => line.includes(root))
      .flatMap((line) => {
        try {
          const parsed = JSON.parse(line) as { kind?: unknown };
          return findStringMatchPathsV01(parsed, root).map(
            (matchPath) =>
              `${typeof parsed.kind === "string" ? parsed.kind : "unknown"}:${matchPath}`,
          );
        } catch {
          return ["non_json"];
        }
      });
    assert.equal(
      privateRootTraceKinds.length,
      0,
      `private disposable root leaked into ${file} at ${JSON.stringify(privateRootTraceKinds)}`,
    );
  }
}
function findStringMatchPathsV01(
  value: unknown,
  needle: string,
  currentPath = "$",
): string[] {
  if (typeof value === "string")
    return value.includes(needle) ? [currentPath] : [];
  if (Array.isArray(value))
    return value.flatMap((entry, index) =>
      findStringMatchPathsV01(entry, needle, `${currentPath}[${index}]`),
    );
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, entry]) =>
      findStringMatchPathsV01(entry, needle, `${currentPath}.${key}`),
    );
  return [];
}
function listFilesV01(root: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(root)) {
    const value = path.join(root, name);
    const stat = lstatSync(value);
    if (stat.isDirectory() && !stat.isSymbolicLink())
      out.push(...listFilesV01(value));
    else if (stat.isFile()) out.push(value);
  }
  return out;
}
function traceValuesV01(
  tracePath: string,
  kind: string,
): Record<string, unknown>[] {
  if (!existsSync(tracePath)) return [];
  return readFileSync(tracePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((entry) => entry.kind === kind)
    .map((entry) => entry.value)
    .filter(
      (value): value is Record<string, unknown> =>
        value !== null && typeof value === "object" && !Array.isArray(value),
    );
}
function receivedMethodsV01(tracePath: string): string[] {
  if (!existsSync(tracePath)) return [];
  return readFileSync(tracePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((entry) => entry.kind === "received")
    .map((entry) => (entry.value as Record<string, unknown>).method)
    .filter((value): value is string => typeof value === "string");
}
async function waitForSpawnV01(child: ChildProcess): Promise<void> {
  if (child.pid !== undefined) return;
  await new Promise<void>((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  });
}
async function stopTestOwnedChildV01(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const settled = new Promise<void>((resolve) => {
    child.once("close", () => resolve());
  });
  child.kill("SIGTERM");
  const graceful = await Promise.race([
    settled.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 1_000)),
  ]);
  if (graceful) return;
  child.kill("SIGKILL");
  await Promise.race([
    settled,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("test-owned fake child cleanup timed out")),
        2_000,
      ),
    ),
  ]);
}
function errorCodeV01(value: unknown): string | null {
  return value instanceof Error
    ? value.message
    : value === null
      ? null
      : "unknown";
}
function sha256FileV01(file: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`;
}
function officialAgentIdentityJwtStorageV01(jwt: string): string {
  return JSON.stringify({
    auth_mode: "agentIdentity",
    OPENAI_API_KEY: null,
    tokens: null,
    last_refresh: null,
    agent_identity: jwt,
    personal_access_token: null,
    bedrock_api_key: null,
    bedrock_access_keys: null,
  });
}
function officialAgentIdentityRecordStorageV01(
  record: Record<string, unknown>,
): string {
  return JSON.stringify({
    auth_mode: "agentIdentity",
    OPENAI_API_KEY: null,
    tokens: null,
    last_refresh: null,
    agent_identity: record,
    personal_access_token: null,
    bedrock_api_key: null,
    bedrock_access_keys: null,
  });
}
function officialManagedChatGptStorageV01(
  record: Record<string, unknown> | null,
): string {
  const idToken = jwtV01(
    {
      "https://api.openai.com/auth": {
        chatgpt_plan_type: "unknown",
        chatgpt_user_id: RAW_USER_ID,
        chatgpt_account_id: RAW_ACCOUNT_ID,
        chatgpt_account_is_fedramp: false,
      },
    },
    "managed-id-token",
  );
  const accessToken = jwtV01(
    { sub: "managed-access-token-fixture" },
    "managed-access-token",
  );
  return JSON.stringify({
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: {
      id_token: idToken,
      access_token: accessToken,
      refresh_token: "fixture-refresh-token",
      account_id: RAW_ACCOUNT_ID,
    },
    last_refresh: "2026-08-28T00:00:00.000Z",
    agent_identity: record,
    personal_access_token: null,
    bedrock_api_key: null,
    bedrock_access_keys: null,
  });
}
function jwtV01(
  payload: Record<string, unknown>,
  signature: string,
  headerOverride: Record<string, unknown> = {},
): string {
  const header = Buffer.from(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
      kid: "fixture-agent-identity-key",
      ...headerOverride,
    }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.${Buffer.from(signature).toString("base64url")}`;
}
function restoreEnvV01(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

void mainV01().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
