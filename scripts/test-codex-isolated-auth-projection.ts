import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import {
  CodexCredentialBrokerErrorV01,
  createFakeCodexCredentialBrokerV01,
  createMacOsKeychainAgentIdentityBrokerV01,
  credentialBrokerBindingFingerprintV01,
  fingerprintBrokerLocatorV01,
  type CodexCredentialBrokerBindingV01,
  type CodexCredentialBrokerV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  CodexIsolatedAuthProjectionErrorV01,
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  assertValidCodexIsolatedAuthObservationV01,
  assertValidCodexIsolatedAuthProjectionV01,
  createCodexIsolatedAuthTestRefV01,
  provisionCodexIsolatedAuthProjectionV01,
  type ProvisionCodexIsolatedAuthProjectionResultV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  createCodexAppServerAdapterV01,
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
  CodexIsolatedAuthObservationV01,
  CodexIsolatedAuthProjectionV01,
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
const FAKE_JWT = jwtV01(
  {
    account_id: RAW_ACCOUNT_ID,
    chatgpt_user_id: RAW_USER_ID,
    email: "not-returned-to-augnes@example.invalid",
    task_id: "fixture-runtime",
    sub: "fixture-subject",
    iss: "fixture-issuer",
    aud: "fixture-audience",
    provider: "openai",
    environment: "production",
    plan_type: "unknown",
    fedramp: false,
    iat: 1_777_000_000,
    exp: 4_102_444_800,
  },
  "fixture-signature-material-not-a-real-token",
);
const OTHER_ACCOUNT_JWT = jwtV01(
  {
    account_id: OTHER_ACCOUNT_ID,
    chatgpt_user_id: OTHER_USER_ID,
    task_id: "fixture-runtime",
    iss: "fixture-issuer",
    aud: "fixture-audience",
    provider: "openai",
    environment: "production",
    plan_type: "unknown",
    fedramp: false,
    iat: 1_777_000_000,
    exp: 4_102_444_800,
  },
  "other-signature-material-not-a-real-token",
);
const CHANGED_ACCOUNT_ID_JWT = jwtV01(
  {
    account_id: OTHER_ACCOUNT_ID,
    chatgpt_user_id: RAW_USER_ID,
    task_id: "fixture-runtime",
    iss: "fixture-issuer",
    aud: "fixture-audience",
    provider: "openai",
    environment: "production",
    plan_type: "unknown",
    fedramp: false,
  },
  "changed-account-id-signature",
);
const CHANGED_USER_ID_JWT = jwtV01(
  {
    account_id: RAW_ACCOUNT_ID,
    chatgpt_user_id: OTHER_USER_ID,
    task_id: "fixture-runtime",
    iss: "fixture-issuer",
    aud: "fixture-audience",
    provider: "openai",
    environment: "production",
    plan_type: "unknown",
    fedramp: false,
  },
  "changed-user-id-signature",
);
const PARTIAL_ID_JWT = jwtV01(
  { account_id: RAW_ACCOUNT_ID, task_id: "fixture-runtime" },
  "partial-signature-material",
);
const SECRET_CANARIES = [
  FAKE_JWT,
  OTHER_ACCOUNT_JWT,
  CHANGED_ACCOUNT_ID_JWT,
  CHANGED_USER_ID_JWT,
  ["sk", "proj-AbCdEfGh12345678"].join("-"),
  ["xoxb", "AbCdEfGh12345678"].join("-"),
  ["AKIA", "ABCDEFGHIJKLMNOP"].join(""),
  ["-----BEGIN", "PRIVATE KEY-----"].join(" "),
  ["ghp", "AbCdEfGhIjKlMnOpQrStUvWxYz012345"].join("_"),
  RAW_ACCOUNT_ID,
  RAW_USER_ID,
  "not-returned-to-augnes@example.invalid",
  "different-account@example.invalid",
  OTHER_ACCOUNT_ID,
  OTHER_USER_ID,
] as const;

type RootsV01 = ReturnType<typeof createRootsV01>;
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
};

async function mainV01(): Promise<void> {
  installZeroNetworkGuard();
  const prior = {
    test: process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE,
    home: process.env.HOME,
    codex: process.env.CODEX_HOME,
    sqlite: process.env.CODEX_SQLITE_HOME,
    tmp: process.env.TMPDIR,
  };
  const roots = createRootsV01();
  process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = "1";
  process.env.HOME = roots.ordinaryHome;
  process.env.CODEX_HOME = roots.ordinaryHome;
  process.env.CODEX_SQLITE_HOME = roots.ordinaryHome;
  process.env.TMPDIR = roots.ordinaryTmp;
  try {
    const provisioned = await provisionV01(roots, "primary", FAKE_JWT);
    assert.equal(provisioned.availability.state, "available_exact");
    assert.match(
      provisioned.credential_attestation.account_identity_fingerprint,
      /^sha256:/u,
    );
    assert.equal(
      provisioned.credential_attestation.claims_authentication_status,
      "credential_claims_unverified_before_codex_auth",
    );
    assertPublicSafeV01(provisioned);
    assertNoSecretApiV01(provisioned);
    const maliciousConsumerBroker = brokerV01(roots, FAKE_JWT);
    assertNoSecretApiV01(maliciousConsumerBroker);
    assertRuntimeSubstitutionRefusedV01(
      maliciousConsumerBroker,
      "spawnExactCodexAppServerV01",
    );
    const maliciousConsumerOwner = ownerV01(
      roots,
      "malicious-consumer-surface",
      provisioned,
      FAKE_JWT,
      "isolated_auth_success",
    );
    assertPublicSafeV01(maliciousConsumerOwner);
    assertNoSecretApiV01(maliciousConsumerOwner);
    assertSourceOwnedCodexIsolatedExecutionOwnerV01(maliciousConsumerOwner);
    assertRuntimeSubstitutionRefusedV01(
      maliciousConsumerOwner,
      "spawnIsolatedCodexAppServerV01",
    );
    assert.throws(
      () =>
        assertSourceOwnedCodexIsolatedExecutionOwnerV01({
          projection: maliciousConsumerOwner.projection,
          spawnIsolatedCodexAppServerV01: async () => {
            throw new Error("forged execution owner must remain unreachable");
          },
        } as unknown as CodexIsolatedAuthenticatedExecutionOwnerV01),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_owner_source_mismatch",
    );
    maliciousConsumerOwner.cleanupV01();

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
      observation.account_identity_fingerprint,
      provisioned.credential_attestation.account_identity_fingerprint,
    );
    assert.equal(
      observation.claims_authentication_status,
      "verified_by_codex_agent_identity_auth",
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
      repository_child_material_present: false,
      shared_home_canary_visible: false,
      shared_codex_home_history_visible: false,
      owned_tmp_present: true,
      shared_tmp_canary_visible: false,
      material_in_argv: false,
      ephemeral_store_policy_present: true,
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
        real_keychain_accesses: 0,
        real_provider_calls: 0,
        successful_external_network_egress: 0,
        cleanup_complete: true,
      }),
    );
  } finally {
    restoreEnvV01("AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE", prior.test);
    restoreEnvV01("HOME", prior.home);
    restoreEnvV01("CODEX_HOME", prior.codex);
    restoreEnvV01("CODEX_SQLITE_HOME", prior.sqlite);
    restoreEnvV01("TMPDIR", prior.tmp);
    rmSync(roots.root, { recursive: true, force: true });
  }
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
    async spawnExactCodexAppServerV01() {
      throw new Error("forged broker must remain unreachable");
    },
  };
  await assert.rejects(
    () =>
      provisionCodexIsolatedAuthProjectionV01({
        projection_id: "codex-isolated-auth:forged-broker",
        provisioning_authorization_ref: refV01(
          "provisioning_authorization",
          "provisioning:forged-broker",
        ),
        provider_ref: refV01("model_provider", "openai"),
        broker_binding: binding,
        broker: forgedBroker,
        codex_executable_ref: refV01("codex_executable", "node-test-host"),
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        compatible_codex_cli_version: "fake-0.143.0",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_source_owner_mismatch",
  );

  const productionLocator = {
    backend: "macos_keychain_generic_password",
    service_name: "augnes-test-never-read",
    account_name: "opaque-test-never-read",
    keychain_path: path.join(roots.root, "never-read.keychain-db"),
  } as const;
  const productionBroker = createMacOsKeychainAgentIdentityBrokerV01({
    binding: {
      ...binding,
      broker_locator_fingerprint:
        fingerprintBrokerLocatorV01(productionLocator),
    },
    service_name: productionLocator.service_name,
    account_name: productionLocator.account_name,
    keychain_path: productionLocator.keychain_path,
  });
  await assert.rejects(
    () =>
      productionBroker.provisionCredentialAttestationV01({
        provisioning_authorization_ref: refV01(
          "provisioning_authorization",
          "provisioning:production-forbidden-in-test",
        ),
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
          provisioning_authorization_ref: refV01(
            "provisioning_authorization",
            "provisioning:fake-forbidden-outside-test",
          ),
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
            material: FAKE_JWT,
          },
          {
            handle_external_id: binding.auth_handle_ref.external_id,
            material: OTHER_ACCOUNT_JWT,
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
        provisioning_authorization_ref: refV01(
          "provisioning_authorization",
          "provisioning:missing",
        ),
        attestation_id: "missing",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_handle_missing",
  );

  const incomplete = brokerV01(roots, PARTIAL_ID_JWT);
  const incompleteAvailability = await incomplete.availabilityV01({
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    observed_at: GENERATED_AT,
  });
  assert.equal(incompleteAvailability.state, "account_identity_unavailable");

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
      substitutedOwner.spawnIsolatedCodexAppServerV01({
        repository_root: roots.repository,
      }),
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
        material: FAKE_JWT,
      },
    ],
    before_return: async () => {
      entered();
      await barrier;
    },
  });
  const first = collisionBroker.provisionCredentialAttestationV01({
    provisioning_authorization_ref: refV01(
      "provisioning_authorization",
      "provisioning:collision",
    ),
    attestation_id: "collision-one",
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  await enteredPromise;
  await assert.rejects(
    () =>
      collisionBroker.provisionCredentialAttestationV01({
        provisioning_authorization_ref: refV01(
          "provisioning_authorization",
          "provisioning:collision",
        ),
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
      "codex_isolated_auth_cli_version_mismatch",
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
    assert.equal(readdirSync(probe.state_parent).length, 0);
  }
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
      preSpawnOwner.spawnIsolatedCodexAppServerV01({
        repository_root: roots.repository,
      }),
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
        material: FAKE_JWT,
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
      failedOwner.spawnIsolatedCodexAppServerV01({
        repository_root: roots.repository,
      }),
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

async function provisionV01(
  roots: RootsV01,
  id: string,
  jwt: string,
): Promise<ProvisionCodexIsolatedAuthProjectionResultV01> {
  const binding = bindingV01();
  return await provisionCodexIsolatedAuthProjectionV01({
    projection_id: `codex-isolated-auth:${id}`,
    provisioning_authorization_ref: refV01(
      "provisioning_authorization",
      `provisioning:${id}`,
    ),
    provider_ref: refV01("model_provider", "openai"),
    broker_binding: binding,
    broker: brokerV01(roots, jwt),
    codex_executable_ref: refV01("codex_executable", "node-test-host"),
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    compatible_codex_cli_version: "fake-0.143.0",
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
function brokerV01(roots: RootsV01, jwt: string): CodexCredentialBrokerV01 {
  const binding = bindingV01();
  return createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material: jwt,
      },
    ],
  });
}
function ownerV01(
  roots: RootsV01,
  id: string,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
  jwt: string,
  scenario: string,
  stateParent?: string,
): CodexIsolatedAuthenticatedExecutionOwnerV01 {
  const parent = stateParent ?? path.join(roots.state, id);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  return new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: provisioned.projection,
    credential_attestation: provisioned.credential_attestation,
    projection_seal: provisioned.projection_seal,
    broker: brokerV01(roots, jwt),
    state_parent: parent,
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
  });
}

async function runProbeV01(
  roots: RootsV01,
  id: string,
  provisioned: ProvisionCodexIsolatedAuthProjectionResultV01,
  jwt: string,
  scenario: string,
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
  const lifecycle: NativeHostLifecycleEventV01[] = [];
  const adapterObservations: CodexAppServerAdapterObservationV01[] = [];
  const authObservations: CodexIsolatedAuthObservationV01[] = [];
  const adapter = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: owner,
    observe: (value) => adapterObservations.push(value),
    observe_isolated_auth: (value) => authObservations.push(value),
  });
  const invocation = adapter.invoke(
    requestV01(roots.repository, id),
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
  };
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
function refV01(refType: string, externalId: string): ExternalRefV01 {
  return createCodexIsolatedAuthTestRefV01({
    ref_type: refType,
    external_id: externalId,
    observed_at: GENERATED_AT,
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
function jwtV01(payload: Record<string, unknown>, signature: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
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
