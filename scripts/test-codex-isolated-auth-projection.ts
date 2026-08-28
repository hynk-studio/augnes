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
  FakeCodexCredentialBrokerV01,
  MacOsKeychainAgentIdentityBrokerV01,
  credentialLeaseIdentityFingerprintV01,
  fingerprintBrokerLocatorV01,
  fingerprintCredentialSourceGenerationV01,
  type CodexCredentialBrokerV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  CodexIsolatedAuthProjectionErrorV01,
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  assertValidCodexIsolatedAuthObservationV01,
  assertValidCodexIsolatedAuthProjectionV01,
  createCodexAccountProjectionFingerprintV01,
  createCodexIsolatedAuthProjectionV01,
  createCodexIsolatedAuthTestRefV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  createCodexAppServerAdapterV01,
  type CodexAppServerAdapterObservationV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import { NativeHostReconciliationRequiredErrorV01 } from "@/lib/vnext/native-host/native-host-contract";
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
const FAKE_ACCOUNT = {
  account: {
    type: "chatgpt",
    email: "not-returned-to-augnes@example.invalid",
    planType: "unknown",
  },
  requiresOpenaiAuth: true,
};
const FAKE_AUTH_STATUS = {
  authMethod: "agentIdentity",
  authToken: null,
  requiresOpenaiAuth: true,
};
const FAKE_LAUNCH_MATERIAL =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0YXNrX2lkIjoiZml4dHVyZS10YXNrIiwiaXNzIjoiZml4dHVyZS1pc3N1ZXIifQ.c2lnbmF0dXJlLWZpeHR1cmUtbWF0ZXJpYWwtbm90LWEtcmVhbC10b2tlbg";
const REPLACED_FAKE_LAUNCH_MATERIAL =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0YXNrX2lkIjoiZm9yZWlnbi10YXNrIiwiaXNzIjoiZml4dHVyZS1pc3N1ZXIifQ.c2lnbmF0dXJlLWZvcmVpZ24tbWF0ZXJpYWwtbm90LWEtcmVhbC10b2tlbg";
const FAKE_OPENAI_SECRET_CANARY = ["sk", "proj-AbCdEfGh12345678"].join("-");
const FAKE_SLACK_SECRET_CANARY = ["xoxb", "AbCdEfGh12345678"].join("-");
const FAKE_AWS_SECRET_CANARY = ["AKIA", "ABCDEFGHIJKLMNOP"].join("");
const FAKE_PRIVATE_KEY_CANARY = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
const FAKE_PAT_SECRET_CANARY = [
  "at",
  "AbCdEfGhIjKlMnOpQrStUvWxYz012345",
].join("-");
const OTHER_SECRET_CANARIES = [
  FAKE_OPENAI_SECRET_CANARY,
  FAKE_SLACK_SECRET_CANARY,
  FAKE_AWS_SECRET_CANARY,
  FAKE_PRIVATE_KEY_CANARY,
] as const;

type TestRootsV01 = ReturnType<typeof createRootsV01>;

type ProbeV01 = {
  result: NativeHostResultV01 | null;
  error: unknown | null;
  settled_error: unknown | null;
  lifecycle_events: NativeHostLifecycleEventV01[];
  adapter_observations: CodexAppServerAdapterObservationV01[];
  auth_observations: unknown[];
  state_parent: string;
  boundary_path: string;
  network_path: string;
  cleanup_path: string;
  trace_path: string;
};

async function mainV01(): Promise<void> {
  installZeroNetworkGuard();
  const previousEnvironment = {
    AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE:
      process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE,
    HOME: process.env.HOME,
    CODEX_HOME: process.env.CODEX_HOME,
    CODEX_SQLITE_HOME: process.env.CODEX_SQLITE_HOME,
  };
  process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = "1";
  const roots = createRootsV01();
  process.env.HOME = roots.ordinaryHome;
  process.env.CODEX_HOME = roots.ordinaryHome;
  process.env.CODEX_SQLITE_HOME = roots.ordinaryHome;

  try {
  const projection = projectionV01();
  const positive = await runProbeV01({
    roots,
    id: "positive",
    projection,
    scenario: "isolated_auth_success",
  });
  assert.equal(positive.error, null);
  assert.equal(positive.settled_error, null);
  assert.equal(
    positive.result?.outcome,
    "completed",
    JSON.stringify({
      public_stop_reason: positive.result?.public_stop_reason,
      summary: positive.result?.summary,
      lifecycle_event_kinds: positive.lifecycle_events.map(
        (event) => event.event_kind,
      ),
    }),
  );
  assert.equal(positive.auth_observations.length, 1);
  assert.equal(readdirSync(positive.state_parent).length, 0);
  assert.equal(readdirSync(roots.lease).length, 0);
  assert.equal(readFileSync(positive.network_path, "utf8"), "0\n");
  assert.equal(readFileSync(positive.cleanup_path, "utf8"), "settled\n");
  const boundary = JSON.parse(
    readFileSync(positive.boundary_path, "utf8"),
  ) as Record<string, unknown>;
  assert.deepEqual(boundary, {
    app_server_material_present: true,
    repository_child_material_present: false,
    shared_home_canary_visible: false,
    shared_codex_home_history_visible: false,
    material_in_argv: false,
    ephemeral_store_policy_present: true,
    shell_core_policy_present: true,
    shell_sensitive_name_excludes_present: true,
  });
  assert.equal(
    positive.result?.adapter_extension?.bounded_metadata.ephemeral_thread,
    true,
  );
  assert.equal(
    positive.result?.adapter_extension?.bounded_metadata
      .repository_command_auth_material_inherited,
    false,
  );
  assert.equal(
    positive.result?.adapter_extension?.bounded_metadata
      .isolated_instruction_sources_empty,
    true,
  );
  assert.ok(
    positive.lifecycle_events.some(
      (event) =>
        event.event_kind === "capability_confirmed" &&
        typeof event.bounded_metadata
          .isolated_auth_observation_fingerprint === "string",
    ),
  );
  const observation =
    positive.auth_observations[0] as CodexIsolatedAuthObservationV01;
  assert.equal(observation.auth_mode, "agent_identity");
  assert.equal(observation.mcp_server_count, 0);
  assert.equal(observation.codex_sqlite_home_reobserved, true);
  assert.equal(observation.shared_state_observed, false);
  assert.equal(observation.attempt_auth_material_persisted, false);
  assert.equal(
    observation.auth_material_exposed_outside_app_server_launch_boundary,
    false,
  );
  const { integrity: _observationIntegrity, ...observationMaterial } =
    observation;
  const mutatedObservationMaterial = {
    ...observationMaterial,
    shared_state_observed: true,
  };
  assert.throws(
    () =>
      assertValidCodexIsolatedAuthObservationV01(
        {
          ...mutatedObservationMaterial,
          integrity: {
            algorithm: "sha256",
            fingerprint: createProtocolSha256V01(
              canonicalizeProtocolValueV01(mutatedObservationMaterial),
            ),
          },
        } as unknown as CodexIsolatedAuthObservationV01,
        projection,
      ),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_observation_binding_invalid",
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
        "The fake route proves mechanics only and grants no provider authority.",
      ],
    },
  });
  assertPublicMaterialSafeV01({
    projection,
    result: positive.result,
    lifecycle_events: positive.lifecycle_events,
    adapter_observations: positive.adapter_observations,
    auth_observations: positive.auth_observations,
    receipt,
  });
  assertNoSeededMaterialV01(roots.root);
  assert.equal(
    readFileSync(path.join(roots.ordinaryHome, "foreign-config.toml"), "utf8"),
    "foreign-user-instruction=true\n",
  );
  assert.equal(
    existsSync(path.join(roots.ordinaryHome, "auth.json")),
    false,
  );

  const replacement = await runProbeV01({
    roots,
    id: "replacement",
    projection,
    scenario: "isolated_auth_success",
  });
  assert.equal(replacement.result?.outcome, "completed");
  const firstStateFingerprint = (
    positive.auth_observations[0] as Record<string, unknown>
  ).state_root_fingerprint;
  const replacementStateFingerprint = (
    replacement.auth_observations[0] as Record<string, unknown>
  ).state_root_fingerprint;
  assert.notEqual(firstStateFingerprint, replacementStateFingerprint);

  await assertProjectionAndBrokerNegativesV01(roots, projection);
  await assertIsolatedStateNegativesV01(roots, projection);
  await assertRuntimeBindingNegativesV01(roots, projection);

  assert.equal(readdirSync(roots.lease).length, 0);
  assertNoSeededMaterialV01(roots.root);
  console.log(
    JSON.stringify({
      status: "passed",
      projection_version: projection.projection_version,
      projection_fingerprint: projection.integrity.fingerprint,
      broker_version: projection.broker_version,
      broker_locator_fingerprint: projection.broker_locator_fingerprint,
      config_policy_fingerprint: projection.config_policy.policy_fingerprint,
      selected_route: projection.projection_mode,
      auth_mode: projection.auth_mode,
      positive_fake_app_server_result: positive.result?.outcome,
      account_projection_reobserved: true,
      ephemeral_thread: true,
      repository_child_auth_material_inherited: false,
      distinct_replacement_state_root: true,
      real_keychain_accesses: 0,
      real_provider_calls: 0,
      external_network_attempts: 0,
      cleanup_complete: true,
    }),
  );
  } finally {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(roots.root, { recursive: true, force: true });
  }
}

void mainV01().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

async function assertProjectionAndBrokerNegativesV01(
  roots: TestRootsV01,
  projection: CodexIsolatedAuthProjectionV01,
): Promise<void> {
  assert.throws(
    () =>
      projectionV01({
        broker_backend_external_id: "foreign-keyring",
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_external_ref_invalid",
  );
  assert.throws(
    () =>
      projectionV01({
        broker_executable_external_id: "foreign-security-binary",
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_external_ref_invalid",
  );
  assert.throws(
    () =>
      projectionV01({
        auth_handle_external_id:
          `codex-auth-handle:${FAKE_OPENAI_SECRET_CANARY}`,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_public_material_forbidden",
  );
  for (const projectionSecret of [
    `fixture:${FAKE_LAUNCH_MATERIAL}`,
    `fixture:${FAKE_PAT_SECRET_CANARY}`,
  ]) {
    assert.throws(
      () => projectionV01({ projection_id: projectionSecret }),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_public_material_forbidden",
    );
  }
  assert.throws(
    () =>
      projectionV01({
        auth_handle_external_id: FAKE_LAUNCH_MATERIAL,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_external_ref_invalid",
  );
  assert.throws(
    () =>
      projectionV01({
        auth_handle_external_id: "/Users/private/auth-handle",
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_external_ref_invalid",
  );
  assert.throws(
    () =>
      new FakeCodexCredentialBrokerV01({
        projection,
        lease_root: roots.lease,
        entries: [
          {
            handle_external_id: "codex-auth-handle:fixture",
            material: FAKE_LAUNCH_MATERIAL,
          },
          {
            handle_external_id: "codex-auth-handle:fixture",
            material: REPLACED_FAKE_LAUNCH_MATERIAL,
          },
        ],
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_handle_duplicate",
  );
  const missing = new FakeCodexCredentialBrokerV01({
    projection,
    lease_root: roots.lease,
    entries: [],
  });
  await assert.rejects(
    missing.withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_handle_missing",
  );
  const foreign = new FakeCodexCredentialBrokerV01({
    projection,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: "codex-auth-handle:foreign",
        material: REPLACED_FAKE_LAUNCH_MATERIAL,
      },
    ],
  });
  await assert.rejects(
    foreign.withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_handle_missing",
  );
  const changedGeneration = new FakeCodexCredentialBrokerV01({
    projection,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: projection.auth_handle_ref.external_id,
        material: REPLACED_FAKE_LAUNCH_MATERIAL,
      },
    ],
  });
  await assert.rejects(
    changedGeneration.withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_generation_mismatch",
  );
  for (const material of [
    ["at", "fake-personal-access-token"].join("-"),
    "not-a-jwt",
  ]) {
    const invalidRouteMaterial = new FakeCodexCredentialBrokerV01({
      projection,
      lease_root: roots.lease,
      entries: [
        {
          handle_external_id: projection.auth_handle_ref.external_id,
          material,
        },
      ],
    });
    await assert.rejects(
      invalidRouteMaterial.withLaunchMaterialV01(async () => undefined),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_material_invalid",
    );
  }
  const activeTestMode = process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  delete process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  try {
    await assert.rejects(
      brokerV01(roots, projection).withLaunchMaterialV01(
        async () => undefined,
      ),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_fake_broker_forbidden_outside_test_mode",
    );
  } finally {
    if (activeTestMode === undefined) {
      delete process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
    } else {
      process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = activeTestMode;
    }
  }

  let releaseFirst!: () => void;
  let markStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  const barrier = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const first = brokerV01(roots, projection);
  const secondProjection = projectionV01({
    projection_id: "codex-isolated-auth:fixture-v01-second-projection",
  });
  const second = brokerV01(roots, secondProjection);
  const firstUse = first.withLaunchMaterialV01(async () => {
    markStarted();
    await barrier;
  });
  await started;
  await assert.rejects(
    second.withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_lease_collision",
  );
  releaseFirst();
  await firstUse;

  const substitutedLeasePath = path.join(
    roots.lease,
    `${credentialLeaseIdentityFingerprintV01(projection).slice("sha256:".length)}.lease`,
  );
  let substitutedLeaseUseCalled = false;
  const substitutedLeaseBroker = new FakeCodexCredentialBrokerV01({
    projection,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: projection.auth_handle_ref.external_id,
        material: FAKE_LAUNCH_MATERIAL,
      },
    ],
    before_return() {
      rmSync(substitutedLeasePath, { force: false });
      writeFileSync(substitutedLeasePath, "substituted-lease\n", {
        encoding: "utf8",
        mode: 0o600,
      });
    },
  });
  await assert.rejects(
    substitutedLeaseBroker.withLaunchMaterialV01(async () => {
      substitutedLeaseUseCalled = true;
    }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_lease_substituted",
  );
  assert.equal(substitutedLeaseUseCalled, false);
  assert.equal(readFileSync(substitutedLeasePath, "utf8"), "substituted-lease\n");
  rmSync(substitutedLeasePath, { force: false });

  await assert.rejects(
    brokerV01(roots, projection).withLaunchMaterialV01(async () => {
      throw new Error("bounded_spawn_failure");
    }),
    /bounded_spawn_failure/u,
  );
  await brokerV01(roots, projection).withLaunchMaterialV01(
    async () => undefined,
  );
  assert.equal(readdirSync(roots.lease).length, 0);

  const staleLeasePath = path.join(
    roots.lease,
    `${credentialLeaseIdentityFingerprintV01(projection).slice("sha256:".length)}.lease`,
  );
  writeFileSync(staleLeasePath, "simulated-crash-tombstone\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  await assert.rejects(
    brokerV01(roots, projection).withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_lease_collision",
  );
  assert.equal(
    readFileSync(staleLeasePath, "utf8"),
    "simulated-crash-tombstone\n",
  );
  rmSync(staleLeasePath, { force: false });

  const leaseRootLink = path.join(roots.root, "lease-root-link");
  symlinkSync(roots.lease, leaseRootLink);
  await assert.rejects(
    new FakeCodexCredentialBrokerV01({
      projection,
      lease_root: leaseRootLink,
      entries: [
        {
          handle_external_id: projection.auth_handle_ref.external_id,
          material: FAKE_LAUNCH_MATERIAL,
        },
      ],
    }).withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_lease_root_invalid",
  );

  const locator = fingerprintBrokerLocatorV01({
    backend: "macos_keychain_generic_password",
    service_name: "org.example.codex-agent",
    account_name: "agent-identity-fixture",
    keychain_path: path.join(roots.temp, "fixture.keychain-db"),
  });
  for (const locatorSecret of [
    FAKE_LAUNCH_MATERIAL,
    `service:${FAKE_LAUNCH_MATERIAL}`,
    `service:${FAKE_PAT_SECRET_CANARY}`,
    ...OTHER_SECRET_CANARIES,
  ]) {
    assert.throws(
      () =>
        fingerprintBrokerLocatorV01({
          backend: "macos_keychain_generic_password",
          service_name: locatorSecret,
          account_name: "agent-identity-fixture",
          keychain_path: path.join(roots.temp, "fixture.keychain-db"),
        }),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_locator_invalid",
    );
  }
  assert.throws(
    () =>
      fingerprintBrokerLocatorV01({
        backend: "macos_keychain_generic_password",
        service_name: "org.example.codex-agent",
        account_name: "agent-identity-fixture",
        keychain_path: path.join(
          roots.temp,
          `${FAKE_OPENAI_SECRET_CANARY}.keychain-db`,
        ),
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_keychain_path_invalid",
  );
  for (const pathSecret of [
    `credential-${FAKE_LAUNCH_MATERIAL}`,
    `credential-${FAKE_PAT_SECRET_CANARY}`,
  ]) {
    assert.throws(
      () =>
        fingerprintBrokerLocatorV01({
          backend: "macos_keychain_generic_password",
          service_name: "org.example.codex-agent",
          account_name: "agent-identity-fixture",
          keychain_path: path.join(roots.temp, `${pathSecret}.keychain-db`),
        }),
      (error: unknown) =>
        error instanceof CodexCredentialBrokerErrorV01 &&
        error.code === "codex_auth_broker_keychain_path_invalid",
    );
  }
  const productionProjection = projectionV01({
    broker_locator_fingerprint: locator,
  });
  const productionBroker = new MacOsKeychainAgentIdentityBrokerV01({
    projection: productionProjection,
    service_name: "org.example.codex-agent",
    account_name: "agent-identity-fixture",
    keychain_path: path.join(roots.temp, "fixture.keychain-db"),
  });
  await assert.rejects(
    productionBroker.withLaunchMaterialV01(async () => undefined),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_production_broker_forbidden_in_test_mode",
  );
  assert.throws(
    () =>
      new MacOsKeychainAgentIdentityBrokerV01({
        projection: productionProjection,
        service_name: "org.example.foreign",
        account_name: "agent-identity-fixture",
        keychain_path: path.join(roots.temp, "fixture.keychain-db"),
      }),
    (error: unknown) =>
      error instanceof CodexCredentialBrokerErrorV01 &&
      error.code === "codex_auth_broker_locator_mismatch",
  );

  const expiredProjection = projectionV01({
    issued_at: "2020-01-01T00:00:00.000Z",
    expires_at: "2020-01-01T01:00:00.000Z",
  });
  const expiredOwner = ownerV01({
    roots,
    projection: expiredProjection,
    id: "expired-projection",
  });
  await assert.rejects(
    expiredOwner.withSpawnMaterialV01({
      repository_root: roots.repository,
      async use() {
        throw new Error("expired_projection_must_not_spawn");
      },
    }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_projection_expired",
  );
  expiredOwner.cleanupV01();

  const lookupIssuedAt = new Date(Date.now() - 1_000).toISOString();
  const lookupExpiresAtMs = Date.now() + 60_000;
  const lookupExpiresAt = new Date(lookupExpiresAtMs).toISOString();
  const expiresDuringLookupProjection = projectionV01({
    projection_id: "codex-isolated-auth:expires-during-lookup",
    issued_at: lookupIssuedAt,
    expires_at: lookupExpiresAt,
  });
  let delayedLookupReached = false;
  let expiredLookupUseCalled = false;
  const expiresDuringLookupBroker = new FakeCodexCredentialBrokerV01({
    projection: expiresDuringLookupProjection,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id:
          expiresDuringLookupProjection.auth_handle_ref.external_id,
        material: FAKE_LAUNCH_MATERIAL,
      },
    ],
    before_return() {
      delayedLookupReached = true;
      // Advance only this isolated test process's clock after exact broker
      // lookup. This deterministically reaches the immediate pre-spawn expiry
      // check without depending on scheduler load or weakening the check.
      Date.now = () => lookupExpiresAtMs;
    },
  });
  const expiresDuringLookupStateParent = path.join(
    roots.state,
    "expires-during-lookup",
  );
  mkdirSync(expiresDuringLookupStateParent, {
    recursive: true,
    mode: 0o700,
  });
  const expiresDuringLookupOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: expiresDuringLookupProjection,
    broker: expiresDuringLookupBroker,
    state_parent: expiresDuringLookupStateParent,
    command: process.execPath,
    prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    base_environment: { NODE_ENV: "test", PATH: process.env.PATH },
  });
  const originalDateNow = Date.now;
  try {
    await assert.rejects(
      expiresDuringLookupOwner.withSpawnMaterialV01({
        repository_root: roots.repository,
        async use() {
          expiredLookupUseCalled = true;
        },
      }),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_projection_expired",
    );
  } finally {
    Date.now = originalDateNow;
  }
  assert.equal(delayedLookupReached, true);
  assert.equal(expiredLookupUseCalled, false);
  expiresDuringLookupOwner.cleanupV01();

  const futureProjection = projectionV01({
    issued_at: "2099-01-01T00:00:00.000Z",
    expires_at: "2100-01-01T00:00:00.000Z",
  });
  const futureOwner = ownerV01({
    roots,
    projection: futureProjection,
    id: "future-projection",
  });
  await assert.rejects(
    futureOwner.withSpawnMaterialV01({
      repository_root: roots.repository,
      async use() {
        throw new Error("future_projection_must_not_spawn");
      },
    }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_projection_not_yet_valid",
  );
  futureOwner.cleanupV01();
}

async function assertIsolatedStateNegativesV01(
  roots: TestRootsV01,
  projection: CodexIsolatedAuthProjectionV01,
): Promise<void> {
  const { integrity: _projectionIntegrity, ...projectionMaterial } = projection;
  const projectionWithExtra = {
    ...projectionMaterial,
    unregistered_route: "forbidden",
  };
  const resealedProjectionWithExtra = {
    ...projectionWithExtra,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(projectionWithExtra),
      ),
    },
  };
  assert.throws(
    () =>
      assertValidCodexIsolatedAuthProjectionV01(
        resealedProjectionWithExtra as unknown as CodexIsolatedAuthProjectionV01,
      ),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_projection_shape_invalid",
  );
  for (const field of [
    "allowed_child_environment_key_fingerprint",
    "forbidden_persistence_surface_fingerprint",
  ] as const) {
    const { integrity: _integrity, ...material } = projection;
    const changedMaterial = {
      ...material,
      [field]: `sha256:${"d".repeat(64)}`,
    };
    const resealed = {
      ...changedMaterial,
      integrity: {
        algorithm: "sha256" as const,
        fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(changedMaterial),
        ),
      },
    };
    assert.throws(
      () =>
        assertValidCodexIsolatedAuthProjectionV01(
          resealed as CodexIsolatedAuthProjectionV01,
        ),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_material_boundary_mismatch",
    );
  }
  for (const [index, secret] of [
    FAKE_LAUNCH_MATERIAL,
    ...OTHER_SECRET_CANARIES,
  ].entries()) {
    assert.throws(
      () =>
        ownerV01({
          roots,
          projection,
          id: `argv-secret-${index}`,
          prefix_args: [secret],
        }),
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_prefix_args_invalid",
    );
  }
  const wrongExecutableProjection = projectionV01({
    codex_executable_fingerprint: `sha256:${"f".repeat(64)}`,
  });
  assert.throws(
    () =>
      ownerV01({
        roots,
        projection: wrongExecutableProjection,
        id: "wrong-executable",
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_executable_substituted",
  );

  const sharedParent = path.join(roots.ordinaryHome, "attempt-state");
  mkdirSync(sharedParent, { mode: 0o700 });
  assert.throws(
    () =>
      ownerV01({
        roots,
        projection,
        id: "shared-parent",
        state_parent: sharedParent,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_shared_state_refused",
  );
  const stateParentLink = path.join(roots.root, "state-parent-link");
  symlinkSync(roots.state, stateParentLink);
  assert.throws(
    () =>
      ownerV01({
        roots,
        projection,
        id: "state-parent-symlink",
        state_parent: stateParentLink,
      }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_state_parent_invalid",
  );

  const replacedHomeParent = path.join(roots.state, "replaced-home");
  mkdirSync(replacedHomeParent, { recursive: true, mode: 0o700 });
  const replacedHomeOwner = ownerV01({
    roots,
    projection,
    id: "replaced-home",
    state_parent: replacedHomeParent,
  });
  const replacedHomeRoot = path.join(
    replacedHomeParent,
    readdirSync(replacedHomeParent)[0]!,
  );
  const replacedHome = path.join(replacedHomeRoot, "home");
  rmSync(replacedHome, { recursive: true, force: false });
  mkdirSync(replacedHome, { mode: 0o700 });
  await assert.rejects(
    replacedHomeOwner.withSpawnMaterialV01({
      repository_root: roots.repository,
      async use() {
        throw new Error("substituted_home_must_not_spawn");
      },
    }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_state_substituted",
  );
  assert.throws(
    () => replacedHomeOwner.cleanupV01(),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_state_substituted",
  );
  assert.equal(readdirSync(replacedHomeParent).length, 0);

  const brokerBarrierParent = path.join(
    roots.state,
    "broker-barrier-home-substitution",
  );
  mkdirSync(brokerBarrierParent, { recursive: true, mode: 0o700 });
  const barrierBroker: CodexCredentialBrokerV01 = {
    projection_fingerprint: projection.integrity.fingerprint,
    async withLaunchMaterialV01(use) {
      const stateRoot = path.join(
        brokerBarrierParent,
        readdirSync(brokerBarrierParent)[0]!,
      );
      const home = path.join(stateRoot, "home");
      rmSync(home, { recursive: true, force: false });
      mkdirSync(home, { mode: 0o700 });
      return await use(FAKE_LAUNCH_MATERIAL);
    },
  };
  const brokerBarrierOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection,
    broker: barrierBroker,
    state_parent: brokerBarrierParent,
    command: process.execPath,
    prefix_args: [
      path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
    ],
    base_environment: { NODE_ENV: "test", PATH: process.env.PATH },
  });
  await assert.rejects(
    brokerBarrierOwner.withSpawnMaterialV01({
      repository_root: roots.repository,
      async use() {
        throw new Error("broker_barrier_substitution_must_not_spawn");
      },
    }),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_state_substituted",
  );
  assert.throws(
    () => brokerBarrierOwner.cleanupV01(),
    (error: unknown) =>
      error instanceof CodexIsolatedAuthProjectionErrorV01 &&
      error.code === "codex_isolated_auth_state_substituted",
  );
  assert.equal(readdirSync(brokerBarrierParent).length, 0);

  for (const variant of ["copy", "symlink"] as const) {
    const id = `auth-file-${variant}`;
    const stateParent = path.join(roots.state, id);
    mkdirSync(stateParent, { recursive: true, mode: 0o700 });
    const owner = ownerV01({ roots, projection, id, state_parent: stateParent });
    const stateRoot = path.join(stateParent, readdirSync(stateParent)[0]!);
    const authPath = path.join(stateRoot, "codex-home", "auth.json");
    if (variant === "copy") {
      writeFileSync(authPath, "{}\n", { mode: 0o600 });
    } else {
      symlinkSync(path.join(roots.ordinaryHome, "foreign-config.toml"), authPath);
    }
    const request = requestV01(roots.repository, id);
    const adapter = createCodexAppServerAdapterV01({
      isolated_authenticated_execution: owner,
    });
    const invocation = adapter.invoke(request, controlV01([]));
    const result = await invocation.result;
    await assert.rejects(
      invocation.settled,
      (error: unknown) =>
        error instanceof CodexIsolatedAuthProjectionErrorV01 &&
        error.code === "codex_isolated_auth_file_persistence_refused",
    );
    assert.equal(result.outcome, "failed");
    assert.equal(
      result.public_stop_reason,
      "codex_isolated_auth_file_persistence_refused",
    );
    assert.equal(readdirSync(stateParent).length, 0);
  }

  const configStateParent = path.join(roots.state, "config-copy");
  mkdirSync(configStateParent, { recursive: true, mode: 0o700 });
  const configOwner = ownerV01({
    roots,
    projection,
    id: "config-copy",
    state_parent: configStateParent,
  });
  const configStateRoot = path.join(
    configStateParent,
    readdirSync(configStateParent)[0]!,
  );
  writeFileSync(
    path.join(configStateRoot, "codex-home", "config.toml"),
    "foreign-user-instruction=true\n",
    { mode: 0o600 },
  );
  const configInvocation = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: configOwner,
  }).invoke(requestV01(roots.repository, "config-copy"), controlV01([]));
  const configResult = await configInvocation.result;
  await configInvocation.settled;
  assert.equal(configResult.outcome, "failed");
  assert.equal(
    configResult.public_stop_reason,
    "codex_isolated_auth_shared_state_material_refused",
  );
  assert.equal(readdirSync(configStateParent).length, 0);

  const disappearingExecutable = path.join(
    roots.temp,
    "disappearing-codex-fixture",
  );
  writeFileSync(disappearingExecutable, "#!/bin/sh\nexit 0\n", {
    encoding: "utf8",
    mode: 0o700,
  });
  const disappearingProjection = projectionV01({
    codex_executable_fingerprint: sha256FileV01(disappearingExecutable),
  });
  const disappearingStateParent = path.join(
    roots.state,
    "disappearing-executable",
  );
  mkdirSync(disappearingStateParent, { recursive: true, mode: 0o700 });
  const disappearingOwner = new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: disappearingProjection,
    broker: brokerV01(roots, disappearingProjection),
    state_parent: disappearingStateParent,
    command: disappearingExecutable,
    base_environment: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      TMPDIR: roots.temp,
    },
  });
  rmSync(disappearingExecutable, { force: false });
  const disappearingInvocation = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: disappearingOwner,
  }).invoke(
    requestV01(roots.repository, "disappearing-executable"),
    controlV01([]),
  );
  const disappearingResult = await disappearingInvocation.result;
  await disappearingInvocation.settled;
  assert.equal(disappearingResult.outcome, "failed");
  assert.equal(
    disappearingResult.public_stop_reason,
    "codex_isolated_auth_executable_substituted",
  );
  assert.equal(readdirSync(disappearingStateParent).length, 0);
  assert.equal(readdirSync(roots.lease).length, 0);
}

async function assertRuntimeBindingNegativesV01(
  roots: TestRootsV01,
  projection: CodexIsolatedAuthProjectionV01,
): Promise<void> {
  const accountMismatch = await runProbeV01({
    roots,
    id: "account-mismatch",
    projection,
    scenario: "isolated_auth_account_mismatch",
  });
  assert.equal(accountMismatch.result?.outcome, "failed");
  assert.equal(
    accountMismatch.result?.public_stop_reason,
    "codex_isolated_auth_account_projection_mismatch",
  );
  const authFallback = await runProbeV01({
    roots,
    id: "auth-fallback",
    projection,
    scenario: "isolated_auth_mode_fallback",
  });
  assert.equal(authFallback.result?.outcome, "failed");
  assert.equal(
    authFallback.result?.public_stop_reason,
    "codex_isolated_auth_mode_mismatch",
  );
  const configMismatch = await runProbeV01({
    roots,
    id: "config-mismatch",
    projection,
    scenario: "isolated_auth_config_mismatch",
  });
  assert.equal(configMismatch.result?.outcome, "failed");
  assert.equal(
    configMismatch.result?.public_stop_reason,
      "codex_isolated_auth_config_policy_mismatch",
  );
  const sqliteHomeMismatch = await runProbeV01({
    roots,
    id: "sqlite-home-mismatch",
    projection,
    scenario: "isolated_auth_sqlite_home_drift",
  });
  assert.equal(sqliteHomeMismatch.result?.outcome, "failed");
  assert.equal(
    sqliteHomeMismatch.result?.public_stop_reason,
    "codex_isolated_auth_config_policy_mismatch",
  );
  const mcpMismatch = await runProbeV01({
    roots,
    id: "mcp-mismatch",
    projection,
    scenario: "isolated_auth_mcp_drift",
  });
  assert.equal(mcpMismatch.result?.outcome, "failed");
  assert.equal(
    mcpMismatch.result?.public_stop_reason,
    "codex_isolated_auth_mcp_policy_mismatch",
  );
  for (const [id, scenario] of [
    ["plugin-mismatch", "isolated_auth_plugin_drift"],
    ["tool-policy-mismatch", "isolated_auth_tool_policy_drift"],
  ] as const) {
    const probe = await runProbeV01({ roots, id, projection, scenario });
    assert.equal(probe.result?.outcome, "failed");
    assert.equal(
      probe.result?.public_stop_reason,
      "codex_isolated_auth_config_policy_mismatch",
    );
  }
  const cliMismatch = await runProbeV01({
    roots,
    id: "cli-version-mismatch",
    projection,
    scenario: "isolated_auth_cli_version_mismatch",
  });
  assert.equal(cliMismatch.result?.outcome, "failed");
  assert.equal(
    cliMismatch.result?.public_stop_reason,
    "codex_isolated_auth_cli_version_mismatch",
  );
  const providerMismatch = await runProbeV01({
    roots,
    id: "provider-mismatch",
    projection,
    scenario: "isolated_auth_provider_mismatch",
  });
  assert.equal(providerMismatch.result, null);
  assert.ok(
    providerMismatch.error instanceof NativeHostReconciliationRequiredErrorV01,
    JSON.stringify({
      error_name:
        providerMismatch.error instanceof Error
          ? providerMismatch.error.name
          : typeof providerMismatch.error,
      error_message:
        providerMismatch.error instanceof Error
          ? providerMismatch.error.message
          : null,
    }),
  );
  assert.equal(
    providerMismatch.error.code,
    "codex_isolated_auth_provider_mismatch",
  );
  const runtimeDrift = await runProbeV01({
    roots,
    id: "runtime-drift",
    projection,
    scenario: "isolated_auth_runtime_drift",
  });
  assert.equal(runtimeDrift.error, null);
  assert.equal(runtimeDrift.result?.outcome, "failed");
  assert.equal(
    runtimeDrift.result?.public_stop_reason,
    "codex_isolated_auth_runtime_policy_drift",
  );
  assert.equal(
    receivedMethodsV01(runtimeDrift.trace_path).includes("thread/start"),
    false,
  );
  assert.equal(readdirSync(runtimeDrift.state_parent).length, 0);

  const instructionSourceDrift = await runProbeV01({
    roots,
    id: "instruction-source-drift",
    projection,
    scenario: "isolated_auth_instruction_source_drift",
  });
  assert.equal(instructionSourceDrift.result, null);
  assert.ok(
    instructionSourceDrift.error instanceof NativeHostReconciliationRequiredErrorV01,
  );
  assert.equal(
    instructionSourceDrift.error.code,
    "codex_isolated_auth_thread_not_ephemeral",
  );
  assert.equal(
    receivedMethodsV01(instructionSourceDrift.trace_path).includes("turn/start"),
    false,
  );
}

function receivedMethodsV01(tracePath: string): string[] {
  return readFileSync(tracePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((entry) => entry.kind === "received")
    .map((entry) => {
      const value = entry.value as Record<string, unknown>;
      return typeof value.method === "string" ? value.method : "";
    })
    .filter(Boolean);
}

async function runProbeV01(input: {
  roots: TestRootsV01;
  id: string;
  projection: CodexIsolatedAuthProjectionV01;
  scenario: string;
}): Promise<ProbeV01> {
  const stateParent = path.join(input.roots.state, input.id);
  const runRoot = path.join(input.roots.runtime, input.id);
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  mkdirSync(runRoot, { recursive: true, mode: 0o700 });
  const boundaryPath = path.join(runRoot, "auth-boundary.json");
  const networkPath = path.join(runRoot, "network-count.txt");
  const cleanupPath = path.join(runRoot, "cleanup.marker");
  const tracePath = path.join(runRoot, "app-server-trace.jsonl");
  const owner = ownerV01({
    roots: input.roots,
    projection: input.projection,
    id: input.id,
    state_parent: stateParent,
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: input.scenario,
      FAKE_CODEX_AUTH_BOUNDARY_PATH: boundaryPath,
      FAKE_CODEX_NETWORK_COUNT_PATH: networkPath,
      FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupPath,
      FAKE_CODEX_TRACE_PATH: tracePath,
    },
  });
  assert.equal(JSON.stringify(owner).includes(FAKE_LAUNCH_MATERIAL), false);
  const lifecycleEvents: NativeHostLifecycleEventV01[] = [];
  const adapterObservations: CodexAppServerAdapterObservationV01[] = [];
  const authObservations: unknown[] = [];
  const adapter = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: owner,
    observe: (observation) => adapterObservations.push(observation),
    observe_isolated_auth: (observation) => authObservations.push(observation),
  });
  const request = requestV01(input.roots.repository, input.id);
  const invocation = adapter.invoke(request, controlV01(lifecycleEvents));
  let result: NativeHostResultV01 | null = null;
  let error: unknown | null = null;
  let settledError: unknown | null = null;
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
    lifecycle_events: lifecycleEvents,
    adapter_observations: adapterObservations,
    auth_observations: authObservations,
    state_parent: stateParent,
    boundary_path: boundaryPath,
    network_path: networkPath,
    cleanup_path: cleanupPath,
    trace_path: tracePath,
  };
}

function ownerV01(input: {
  roots: TestRootsV01;
  projection: CodexIsolatedAuthProjectionV01;
  id: string;
  state_parent?: string;
  prefix_args?: string[];
  test_environment?: Record<string, string | undefined>;
}): CodexIsolatedAuthenticatedExecutionOwnerV01 {
  const stateParent = input.state_parent ?? path.join(input.roots.state, input.id);
  mkdirSync(stateParent, { recursive: true, mode: 0o700 });
  return new CodexIsolatedAuthenticatedExecutionOwnerV01({
    projection: input.projection,
    broker: brokerV01(input.roots, input.projection),
    state_parent: stateParent,
    command: process.execPath,
    prefix_args: input.prefix_args ?? [
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
      TMPDIR: input.roots.temp,
      LANG: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
    test_environment: input.test_environment,
  });
}

function brokerV01(
  roots: TestRootsV01,
  projection: CodexIsolatedAuthProjectionV01,
): FakeCodexCredentialBrokerV01 {
  return new FakeCodexCredentialBrokerV01({
    projection,
    lease_root: roots.lease,
    entries: [
      {
        handle_external_id: projection.auth_handle_ref.external_id,
        material: FAKE_LAUNCH_MATERIAL,
      },
    ],
  });
}

function projectionV01(
  overrides: {
    projection_id?: string;
    auth_handle_external_id?: string;
    broker_locator_fingerprint?: string;
    auth_source_generation_fingerprint?: string;
    codex_executable_fingerprint?: string;
    provider_external_id?: string;
    broker_backend_external_id?: string;
    broker_executable_external_id?: string;
    issued_at?: string;
    expires_at?: string;
  } = {},
): CodexIsolatedAuthProjectionV01 {
  const accountProjection = createCodexAccountProjectionFingerprintV01({
    auth_status: FAKE_AUTH_STATUS,
    account: FAKE_ACCOUNT,
  });
  const authHandleExternalId =
    overrides.auth_handle_external_id ?? "codex-auth-handle:fixture";
  const brokerLocatorFingerprint =
    overrides.broker_locator_fingerprint ?? `sha256:${"c".repeat(64)}`;
  return createCodexIsolatedAuthProjectionV01({
    projection_id:
      overrides.projection_id ?? "codex-isolated-auth:fixture-v01",
    provider_ref: refV01(
      "model_provider",
      overrides.provider_external_id ?? "openai",
    ),
    auth_handle_ref: refV01(
      "opaque_auth_handle",
      authHandleExternalId,
    ),
    broker_backend_ref: refV01(
      "auth_broker_backend",
      overrides.broker_backend_external_id ??
        "macos-keychain-generic-password",
    ),
    broker_executable_ref: refV01(
      "auth_broker_executable",
      overrides.broker_executable_external_id ?? "security-system-binary",
    ),
    broker_executable_fingerprint: `sha256:${"b".repeat(64)}`,
    broker_locator_fingerprint: brokerLocatorFingerprint,
    auth_source_generation_fingerprint:
      overrides.auth_source_generation_fingerprint ??
      fingerprintCredentialSourceGenerationV01({
        auth_handle_external_id: authHandleExternalId,
        broker_locator_fingerprint: brokerLocatorFingerprint,
        material: FAKE_LAUNCH_MATERIAL,
      }),
    expected_account_projection_fingerprint: accountProjection,
    codex_executable_ref: refV01("codex_executable", "node-test-host"),
    codex_executable_fingerprint:
      overrides.codex_executable_fingerprint ?? sha256FileV01(process.execPath),
    compatible_codex_cli_version: "fake-0.143.0",
    issued_at: overrides.issued_at ?? GENERATED_AT,
    expires_at: overrides.expires_at ?? EXPIRES_AT,
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

function controlV01(lifecycleEvents: NativeHostLifecycleEventV01[]) {
  return {
    cancellation_signal: new AbortController().signal,
    timeout_ms: 10_000,
    stop_settle_timeout_ms: 3_000,
    lifecycle_sink: {
      async report_event(event: NativeHostLifecycleEventV01) {
        lifecycleEvents.push(event);
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
    temp: path.join(root, "temp"),
    ordinaryHome: path.join(root, "ordinary-codex-home"),
  };
  for (const directory of Object.values(roots).slice(1)) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
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
  return roots;
}

function assertPublicMaterialSafeV01(value: unknown): void {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error(code, issuePath) {
        if (code !== "provider_specific_core_field") {
          issues.push(`${code}:${issuePath ?? "$"}`);
        }
      },
      warning() {},
    },
    {
      secret_material_message: "No fake auth material may escape.",
      provider_specific_field_message:
        "Provider identity remains typed in protocol refs.",
      allowed_false_invariant_fields: new Set([
        "raw_provider_payload_included",
        "raw_output_included",
        "raw_output_persisted",
        "raw_prompt_persisted",
        "raw_transcript_persisted",
        "secret_material_persisted",
        "shared_state_observed",
        "attempt_auth_material_persisted",
        "auth_material_exposed_outside_app_server_launch_boundary",
        "repository_command_auth_material_inherited",
      ]),
    },
  );
  walkValueStringsV01(value, (candidate) => {
    assert.equal(
      path.isAbsolute(candidate) ||
        /^[A-Za-z]:[\\/]/u.test(candidate) ||
        /^\\\\[^\\]+\\[^\\]+/u.test(candidate),
      false,
      "Public material contains an absolute local path.",
    );
  });
  assert.deepEqual(issues, []);
}

function walkValueStringsV01(
  value: unknown,
  visit: (candidate: string) => void,
): void {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkValueStringsV01(item, visit);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const item of Object.values(value as Record<string, unknown>)) {
    walkValueStringsV01(item, visit);
  }
}

function assertNoSeededMaterialV01(root: string): void {
  const forbidden = [
    FAKE_LAUNCH_MATERIAL,
    REPLACED_FAKE_LAUNCH_MATERIAL,
    ...OTHER_SECRET_CANARIES,
    "not-returned-to-augnes@example.invalid",
  ];
  for (const file of listFilesV01(root)) {
    const value = readFileSync(file, "utf8");
    for (const candidate of forbidden) {
      assert.equal(value.includes(candidate), false, `material leaked into ${file}`);
    }
  }
}

function listFilesV01(root: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(root)) {
    const candidate = path.join(root, name);
    const stat = lstatSync(candidate);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) files.push(...listFilesV01(candidate));
    else if (stat.isFile()) files.push(candidate);
  }
  return files;
}

function sha256FileV01(file: string): string {
  return `sha256:${createHash("sha256")
    .update(readFileSync(file))
    .digest("hex")}`;
}
