import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import {
  createFakeCodexCredentialBrokerV01,
  credentialBrokerBindingFingerprintV01,
  type CodexCredentialBrokerBindingV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  createCodexIsolatedAuthProvisioningBindingV01,
  createCodexIsolatedAuthTestRefV01,
  provisionCodexIsolatedAuthProjectionV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import { probeCodexIsolatedAuthCredentialFreeCompatibilityV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 } from "@/types/vnext/codex-isolated-auth-projection";

const ISSUED_AT = "2026-08-28T00:00:00.000Z";
const EXPIRES_AT = "2099-08-29T06:00:00.000Z";
const RAW_ACCOUNT_ID = "acct-fixture-stable-private";
const RAW_USER_ID = "user-fixture-stable-private";
const EMAIL = "not-returned-to-augnes@example.invalid";
const AGENT_PRIVATE_KEY = Buffer.from(
  "fixture-agent-private-key-material-never-public",
  "utf8",
).toString("base64");
const FAKE_JWT = jwtV01({
  iss: "https://chatgpt.com/codex-backend/agent-identity",
  aud: "codex-app-server",
  iat: 1_777_000_000,
  exp: 4_102_444_800,
  agent_runtime_id: "fixture-agent-runtime",
  agent_private_key: AGENT_PRIVATE_KEY,
  account_id: RAW_ACCOUNT_ID,
  chatgpt_user_id: RAW_USER_ID,
  email: EMAIL,
  plan_type: "unknown",
  chatgpt_account_is_fedramp: false,
});

export async function createCommissionedLiveTrainingIsolatedAuthTestHarnessV01(input: {
  repository_root: string;
  lease_root: string;
  state_root: string;
  fake_app_server_path: string;
}) {
  for (const directory of [input.lease_root, input.state_root])
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  const binding = bindingV01();
  const providerRef = refV01("model_provider", "openai");
  const executableFingerprint = sha256FileV01(process.execPath);
  const provisioningBinding =
    createCodexIsolatedAuthProvisioningBindingV01({
      binding_id: "provisioning:cw1-live-training-test",
      auth_handle_ref: binding.auth_handle_ref,
      broker_binding_fingerprint:
        credentialBrokerBindingFingerprintV01(binding),
      provider_ref: providerRef,
      codex_executable_fingerprint: executableFingerprint,
      executable_identity_class: "test_emulated_profile",
      compatible_codex_cli_version:
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      issued_at: ISSUED_AT,
      expires_at: EXPIRES_AT,
    });
  const provisioned = await provisionCodexIsolatedAuthProjectionV01({
    projection_id: "codex-isolated-auth:cw1-live-training-test",
    provisioning_binding: provisioningBinding,
    provisioning_binding_ref: refV01(
      "codex_auth_provisioning_binding",
      provisioningBinding.binding_id,
    ),
    provider_ref: providerRef,
    broker_binding: binding,
    broker: brokerV01(binding, input.lease_root),
    codex_executable_ref: refV01("codex_executable", "node-test-host"),
    codex_executable_fingerprint: executableFingerprint,
    executable_identity_class: "test_emulated_profile",
    compatible_codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    issued_at: ISSUED_AT,
    expires_at: EXPIRES_AT,
  });
  const compatibilityState = path.join(input.state_root, "compatibility");
  const compatibilityTrace = path.join(
    input.state_root,
    "compatibility-trace.jsonl",
  );
  const compatibilityNetwork = path.join(
    input.state_root,
    "compatibility-network-count.txt",
  );
  mkdirSync(compatibilityState, { recursive: true, mode: 0o700 });
  const credentialFreePreflight =
    await probeCodexIsolatedAuthCredentialFreeCompatibilityV01({
      command: process.execPath,
      expected_executable_fingerprint: executableFingerprint,
      executable_identity_class: "test_emulated_profile",
      state_parent: realpathSync(compatibilityState),
      repository_root: input.repository_root,
      base_environment: {
        PATH: process.env.PATH,
        LANG: "C",
        TZ: "UTC",
        NO_COLOR: "1",
      },
      test_prefix_args: [input.fake_app_server_path],
      test_environment: {
        AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
        FAKE_CODEX_SCENARIO: "isolated_auth_semantic_preflight",
        FAKE_CODEX_TRACE_PATH: compatibilityTrace,
        FAKE_CODEX_NETWORK_COUNT_PATH: compatibilityNetwork,
      },
      observed_at: ISSUED_AT,
    });
  return {
    projection: provisioned.projection,
    credential_free_preflight: credentialFreePreflight,
    compatibility_trace_path: compatibilityTrace,
    compatibility_network_count_path: compatibilityNetwork,
    create_owner(ownerInput: {
      repository_root: string;
      state_parent: string;
      test_environment: Record<string, string | undefined>;
    }): CodexIsolatedAuthenticatedExecutionOwnerV01 {
      mkdirSync(ownerInput.state_parent, { recursive: true, mode: 0o700 });
      return new CodexIsolatedAuthenticatedExecutionOwnerV01({
        projection: provisioned.projection,
        credential_attestation: provisioned.credential_attestation,
        projection_seal: provisioned.projection_seal,
        broker: brokerV01(binding, input.lease_root),
        state_parent: ownerInput.state_parent,
        repository_root: ownerInput.repository_root,
        command: process.execPath,
        prefix_args: [input.fake_app_server_path],
        base_environment: {
          NODE_ENV: "test",
          PATH: process.env.PATH,
          LANG: "C",
          TZ: "UTC",
          NO_COLOR: "1",
        },
        test_environment: ownerInput.test_environment,
      });
    },
  };
}

function bindingV01(): CodexCredentialBrokerBindingV01 {
  return {
    auth_handle_ref: refV01(
      "opaque_auth_handle",
      "codex-auth-handle:cw1-fixture",
    ),
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
}

function brokerV01(
  binding: CodexCredentialBrokerBindingV01,
  leaseRoot: string,
) {
  return createFakeCodexCredentialBrokerV01({
    binding,
    lease_root: leaseRoot,
    entries: [
      {
        handle_external_id: binding.auth_handle_ref.external_id,
        material: officialAgentIdentityJwtStorageV01(FAKE_JWT),
      },
    ],
  });
}

function refV01(refType: string, externalId: string): ExternalRefV01 {
  return createCodexIsolatedAuthTestRefV01({
    ref_type: refType,
    external_id: externalId,
    observed_at: ISSUED_AT,
  });
}

function sha256FileV01(file: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`;
}

function jwtV01(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
      kid: "fixture-agent-identity-key",
    }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.${Buffer.from("fixture-signature-material-not-a-real-token").toString("base64url")}`;
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
