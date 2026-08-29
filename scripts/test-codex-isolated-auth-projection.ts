import assert from "node:assert/strict";
import { spawn } from "node:child_process";
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
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import {
  CodexCredentialBrokerErrorV01,
  bindCodexBrokerPrivateLaunchCapabilityV01,
  createFakeCodexCredentialBrokerV01,
  createMacOsKeychainAgentIdentityBrokerV01,
  credentialBrokerBindingFingerprintV01,
  fingerprintBrokerLocatorV01,
  spawnCodexAppServerWithPrivateCapabilityV01,
  verifyCodexBrokerProcessIdentitySubstitutionForTestV01,
  type CodexCredentialBrokerBindingV01,
  type CodexCredentialBrokerV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  CodexIsolatedAuthProjectionErrorV01,
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  assertValidCodexIsolatedAuthObservationV01,
  assertValidCodexIsolatedAuthProjectionV01,
  createCodexIsolatedAuthProvisioningAuthorizationV01,
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
  RAW_ACCOUNT_ID,
  RAW_USER_ID,
  "not-returned-to-augnes@example.invalid",
  "different-account@example.invalid",
  OTHER_ACCOUNT_ID,
  OTHER_USER_ID,
  AGENT_PRIVATE_KEY,
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
    assert.equal(
      Reflect.get(maliciousConsumerBroker, "spawnExactCodexAppServerV01"),
      undefined,
      "the public broker must expose no authenticated spawn operation",
    );
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
    class MaliciousDerivedExecutionOwnerV01 extends
      CodexIsolatedAuthenticatedExecutionOwnerV01 {
      override assertRepositoryRootV01(_value: string): void {}
      override async spawnIsolatedCodexAppServerV01(): Promise<never> {
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
      "spawnIsolatedCodexAppServerV01",
    );
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
    await agentIdentityClaimNegativesV01(roots);
    await runtimePolicyNegativesV01(roots, provisioned);
    await tmpAndFailureNegativesV01(roots, provisioned);
    await leaseReleaseRollbackV01(roots, provisioned);
    await poisonWriteFailureReplayV01(roots);
    await exactProcessBirthRollbackV01();
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
    const availability = await brokerV01(roots, material).availabilityV01({
      codex_executable_fingerprint: sha256FileV01(process.execPath),
      observed_at: GENERATED_AT,
    });
    assert.notEqual(availability.state, "available_exact", id);
  }

  await assert.rejects(
    () =>
      brokerV01(roots, FAKE_JWT).provisionCredentialAttestationV01({
        provisioning_authorization_ref: refV01(
          "codex_auth_provisioning_authorization",
          "provisioning:expiry-overrun",
        ),
        attestation_id: "expiry-overrun",
        issued_at: GENERATED_AT,
        expires_at: "2100-01-01T00:00:00.000Z",
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code ===
        "codex_auth_broker_projection_expiry_exceeds_credential",
  );

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 120;
  const issuedAt = new Date((now - 10) * 1000).toISOString();
  const projectionExpiresAt = new Date((now + 30) * 1000).toISOString();
  const expiringJwt = jwtV01(
    {
      ...BASE_CLAIMS,
      iat: now - 20,
      exp,
      account_id: RAW_ACCOUNT_ID,
      chatgpt_user_id: RAW_USER_ID,
    },
    "expiring-signature",
  );
  const binding = bindingV01();
  let observedNow = now;
  const broker = createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material: expiringJwt,
      },
    ],
    now_epoch_seconds: () => observedNow,
  });
  const providerRef = refV01("model_provider", "openai", issuedAt);
  const authorization = createCodexIsolatedAuthProvisioningAuthorizationV01({
    authorization_id: "provisioning:expires-between",
    auth_handle_ref: binding.auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(binding),
    provider_ref: providerRef,
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    compatible_codex_cli_version: "fake-0.143.0",
    issued_at: issuedAt,
    expires_at: projectionExpiresAt,
  });
  const expiring = await provisionCodexIsolatedAuthProjectionV01({
    projection_id: "codex-isolated-auth:expires-between",
    provisioning_authorization: authorization,
    provisioning_authorization_ref: refV01(
      "codex_auth_provisioning_authorization",
      authorization.authorization_id,
      issuedAt,
    ),
    provider_ref: providerRef,
    broker_binding: binding,
    broker,
    codex_executable_ref: refV01("codex_executable", "node-test-host", issuedAt),
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    compatible_codex_cli_version: "fake-0.143.0",
    issued_at: issuedAt,
    expires_at: projectionExpiresAt,
  });
  const stateParent = path.join(roots.state, "expires-between");
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  const owner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: expiring.projection,
    credential_attestation: expiring.credential_attestation,
    projection_seal: expiring.projection_seal,
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
    },
  });
  observedNow = exp + 1;
  await assert.rejects(
    () => owner.spawnIsolatedCodexAppServerV01(),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_credential_expired",
  );
  assert.equal(readdirSync(stateParent).length, 0);
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
  const forgedAuthorization = createCodexIsolatedAuthProvisioningAuthorizationV01({
    authorization_id: "provisioning:forged-broker",
    auth_handle_ref: binding.auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(binding),
    provider_ref: forgedProviderRef,
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    compatible_codex_cli_version: "fake-0.143.0",
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  await assert.rejects(
    () =>
      provisionCodexIsolatedAuthProjectionV01({
        projection_id: "codex-isolated-auth:forged-broker",
        provisioning_authorization: forgedAuthorization,
        provisioning_authorization_ref: refV01(
          "codex_auth_provisioning_authorization",
          "provisioning:forged-broker",
        ),
        provider_ref: forgedProviderRef,
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
  const clonedAuthorization = structuredClone(forgedAuthorization);
  await assert.rejects(
    () =>
      provisionCodexIsolatedAuthProjectionV01({
        projection_id: "codex-isolated-auth:forged-authorization",
        provisioning_authorization: clonedAuthorization,
        provisioning_authorization_ref: refV01(
          "codex_auth_provisioning_authorization",
          clonedAuthorization.authorization_id,
        ),
        provider_ref: forgedProviderRef,
        broker_binding: binding,
        broker: brokerV01(roots, FAKE_JWT),
        codex_executable_ref: refV01("codex_executable", "node-test-host"),
        codex_executable_fingerprint: sha256FileV01(process.execPath),
        compatible_codex_cli_version: "fake-0.143.0",
        issued_at: GENERATED_AT,
        expires_at: EXPIRES_AT,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_provisioning_authorization_refused",
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
      substitutedOwner.spawnIsolatedCodexAppServerV01(),
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
      preSpawnOwner.spawnIsolatedCodexAppServerV01(),
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
      failedOwner.spawnIsolatedCodexAppServerV01(),
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
        material: FAKE_JWT,
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
      () => owner.spawnIsolatedCodexAppServerV01(),
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
          material: FAKE_JWT,
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
      () => replayOwner.spawnIsolatedCodexAppServerV01(),
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
    unrelated.kill("SIGKILL");
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
        material: FAKE_JWT,
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
      () => timeoutOwner.spawnIsolatedCodexAppServerV01(),
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
            material: FAKE_JWT,
          },
        ],
      }),
    });
    await assert.rejects(
      () => timeoutReplayOwner.spawnIsolatedCodexAppServerV01(),
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
    child.kill("SIGKILL");
    unrelated.kill("SIGKILL");
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
        material: POISON_FAILURE_JWT,
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
      () => owner.spawnIsolatedCodexAppServerV01(),
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
              material: POISON_FAILURE_JWT,
            },
          ],
        }),
      });
      await assert.rejects(
        () => replayOwner.spawnIsolatedCodexAppServerV01(),
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
  const authorization = createCodexIsolatedAuthProvisioningAuthorizationV01({
    authorization_id: `provisioning:${id}`,
    auth_handle_ref: binding.auth_handle_ref,
    broker_binding_fingerprint: credentialBrokerBindingFingerprintV01(binding),
    provider_ref: providerRef,
    codex_executable_fingerprint: sha256FileV01(process.execPath),
    compatible_codex_cli_version: "fake-0.143.0",
    issued_at: GENERATED_AT,
    expires_at: EXPIRES_AT,
  });
  return await provisionCodexIsolatedAuthProjectionV01({
    projection_id: `codex-isolated-auth:${id}`,
    provisioning_authorization: authorization,
    provisioning_authorization_ref: refV01(
      "codex_auth_provisioning_authorization",
      `provisioning:${id}`,
    ),
    provider_ref: providerRef,
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
