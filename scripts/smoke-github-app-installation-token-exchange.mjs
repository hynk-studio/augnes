import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const fakeJwt = "fake.jwt.signature";
const fakeInstallationId = "987654321";
const fakeToken = "ghs_fake_installation_token_do_not_print";
const fakePrivateKeyPath = "/very/secret/local/path/augnes-app-private-key.pem";
const fakeAllowlist = "Aurna-code/augnes,octo-org/example";
const targetRef = "Aurna-code/augnes#140";
const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-app-token-exchange-"));
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;

let globalFetchCalls = 0;
globalThis.fetch = async () => {
  globalFetchCalls += 1;
  throw new Error("GitHub App installation-token exchange smoke must not call global fetch.");
};

try {
  const { validateGitHubAppConfig } = await import("../lib/github-app-config.ts");
  const {
    evaluateGitHubAppTargetPolicy,
  } = await import("../lib/github-app-target-policy.ts");
  const {
    buildGitHubAppInstallationTokenRequest,
    exchangeGitHubAppInstallationToken,
    redactGitHubAppInstallationTokenExchangeResult,
  } = await import("../lib/github-app-installation-token-exchange.ts");

  const allowedPolicy = evaluateGitHubAppTargetPolicy({
    targetSurface: "github_pr_comment",
    targetRef,
    config: validateGitHubAppConfig({
      AUGNES_GITHUB_APP_TOKEN_PROVIDER: "installation_token",
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_INSTALLATION_ID: fakeInstallationId,
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePrivateKeyPath,
      AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: fakeAllowlist,
      AUGNES_GITHUB_APP_PERMISSION_PROFILE: "pr_comment_minimal",
    }),
  });
  assert.equal(allowedPolicy.allowed, true, "fixture policy should allow target");

  const request = buildGitHubAppInstallationTokenRequest({
    installationId: fakeInstallationId,
    jwt: fakeJwt,
    targetPolicy: allowedPolicy,
    permissionProfile: "pr_comment_minimal",
  });
  assert.equal(
    request.url,
    `https://api.github.com/app/installations/${fakeInstallationId}/access_tokens`,
    "request URL should target the installation access token endpoint",
  );
  assert.match(request.url, /\/app\/installations\/\d+\/access_tokens$/);
  assert.equal(request.method, "POST");
  assert.equal(request.headers.authorization, "Bearer <redacted>");
  assert.deepEqual(request.body.repositories, ["Aurna-code/augnes"]);
  assert.deepEqual(request.body.permissions, {
    issues: "write",
    pull_requests: "read",
  });
  assertPublicSafe(request.public_safe);

  await assertRejectsBounded(
    () =>
      exchangeGitHubAppInstallationToken({
        installationId: fakeInstallationId,
        jwt: fakeJwt,
        targetPolicy: allowedPolicy,
        permissionProfile: "pr_comment_minimal",
      }),
    "GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_DISABLED",
  );

  await assertRejectsBounded(
    () =>
      exchangeGitHubAppInstallationToken({
        installationId: fakeInstallationId,
        jwt: fakeJwt,
        targetPolicy: allowedPolicy,
        permissionProfile: "pr_comment_minimal",
        enabled: true,
      }),
    "GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_FETCH_IMPL_REQUIRED",
  );
  assert.equal(globalFetchCalls, 0, "missing fetchImpl must not call global fetch");

  let fakeFetchCalls = 0;
  let fakeFetchAuthorization = "";
  let fakeFetchBody = null;
  const fakeFetch = async (_url, init) => {
    fakeFetchCalls += 1;
    fakeFetchAuthorization = String(init?.headers?.authorization ?? "");
    fakeFetchBody = JSON.parse(String(init?.body ?? "{}"));
    return new Response(
      JSON.stringify({
        token: fakeToken,
        expires_at: "2030-01-01T00:00:00.000Z",
        permissions: {
          issues: "write",
          pull_requests: "read",
        },
        repositories: [{ full_name: "Aurna-code/augnes" }],
      }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  };

  const exchanged = await exchangeGitHubAppInstallationToken({
    installationId: fakeInstallationId,
    jwt: fakeJwt,
    targetPolicy: allowedPolicy,
    permissionProfile: "pr_comment_minimal",
    enabled: true,
    fetchImpl: fakeFetch,
  });
  assert.equal(fakeFetchCalls, 1, "enabled exchange should call injected fake fetch once");
  assert.equal(fakeFetchAuthorization, `Bearer ${fakeJwt}`);
  assert.deepEqual(fakeFetchBody.repositories, ["Aurna-code/augnes"]);
  assert.deepEqual(fakeFetchBody.permissions, {
    issues: "write",
    pull_requests: "read",
  });
  assert.equal(exchanged.exchanged, true);
  assert.equal(exchanged.token, fakeToken, "fake token should be returned internally");
  assert.equal(exchanged.public_safe.token_present, true);
  assert.equal(exchanged.public_safe.expires_at, "2030-01-01T00:00:00.000Z");
  assert.deepEqual(exchanged.public_safe.permission_keys, [
    "issues",
    "pull_requests",
  ]);
  assert.equal(exchanged.public_safe.repository_count, 1);
  assertPublicSafe(exchanged.public_safe);
  assertPublicSafe(redactGitHubAppInstallationTokenExchangeResult(exchanged));

  await assertRejectsBounded(
    () =>
      exchangeGitHubAppInstallationToken({
        installationId: fakeInstallationId,
        jwt: fakeJwt,
        targetPolicy: allowedPolicy,
        permissionProfile: "pr_comment_minimal",
        enabled: true,
        fetchImpl: async () =>
          new Response(JSON.stringify({ token: fakeToken }), { status: 500 }),
      }),
    "GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_REQUEST_FAILED",
  );

  await assertRejectsBounded(
    () =>
      exchangeGitHubAppInstallationToken({
        installationId: fakeInstallationId,
        jwt: fakeJwt,
        targetPolicy: allowedPolicy,
        permissionProfile: "pr_comment_minimal",
        enabled: true,
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              token: fakeToken,
              expires_at: "2030-01-01T00:00:00.000Z",
              permissions: "not-an-object",
              repositories: null,
              raw_payload_secret: fakeJwt,
            }),
            { status: 201, headers: { "content-type": "application/json" } },
          ),
      }),
    "GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INVALID_PERMISSIONS",
  );

  const disallowedPolicy = evaluateGitHubAppTargetPolicy({
    targetSurface: "github_pr_comment",
    targetRef: "outside-org/outside-repo#1",
    config: validateGitHubAppConfig({
      AUGNES_GITHUB_APP_TOKEN_PROVIDER: "installation_token",
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_INSTALLATION_ID: fakeInstallationId,
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePrivateKeyPath,
      AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: fakeAllowlist,
    }),
  });
  assert.equal(disallowedPolicy.allowed, false);
  await assertBlocksBeforeFetch(() =>
    exchangeGitHubAppInstallationToken({
      installationId: fakeInstallationId,
      jwt: fakeJwt,
      targetPolicy: disallowedPolicy,
      permissionProfile: "pr_comment_minimal",
      enabled: true,
      fetchImpl: failIfCalledFetch,
    }),
  );
  await assertBlocksBeforeFetch(() =>
    exchangeGitHubAppInstallationToken({
      installationId: "not-numeric",
      jwt: fakeJwt,
      targetPolicy: allowedPolicy,
      permissionProfile: "pr_comment_minimal",
      enabled: true,
      fetchImpl: failIfCalledFetch,
    }),
  );
  await assertBlocksBeforeFetch(() =>
    exchangeGitHubAppInstallationToken({
      installationId: fakeInstallationId,
      jwt: " ",
      targetPolicy: allowedPolicy,
      permissionProfile: "pr_comment_minimal",
      enabled: true,
      fetchImpl: failIfCalledFetch,
    }),
  );
  await assertBlocksBeforeFetch(() =>
    exchangeGitHubAppInstallationToken({
      installationId: fakeInstallationId,
      jwt: fakeJwt,
      targetPolicy: allowedPolicy,
      permissionProfile: "admin_everything",
      enabled: true,
      fetchImpl: failIfCalledFetch,
    }),
  );

  const providerSource = readFileSync("lib/github-token-provider.ts", "utf8");
  assert.doesNotMatch(providerSource, /github-app-installation-token-exchange/);
  const coreGatedSource = readFileSync("lib/core-gated-publish.ts", "utf8");
  assert.doesNotMatch(coreGatedSource, /github-app-installation-token-exchange/);
  const publicationSource = readFileSync("lib/github-publication.ts", "utf8");
  assert.doesNotMatch(publicationSource, /github-app-installation-token-exchange/);

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["smoke:github-app-installation-token-exchange"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-github-app-installation-token-exchange.mjs",
    "package.json should register smoke:github-app-installation-token-exchange",
  );
  for (const dependencyName of ["jose", "jsonwebtoken", "jwt-simple", "node-jose"]) {
    assert.equal(Object.hasOwn(packageJson.dependencies ?? {}, dependencyName), false);
    assert.equal(Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName), false);
  }

  assert.equal(globalFetchCalls, 0, "smoke should make no global fetch/OpenAI/GitHub calls");
  assert.equal(existsSync(dbPath), false, "exchange smoke should not create DB");

  const output = JSON.stringify(
    {
      smoke: "github-app-installation-token-exchange",
      request_url_matches_installation_endpoint: true,
      method: request.method,
      repository_scope_count: request.public_safe.repository_scope_count,
      permission_profile: request.public_safe.permission_profile,
      deterministic_permissions: request.body.permissions,
      disabled_exchange_calls_fetch: false,
      missing_fetch_impl_calls_global_fetch: false,
      fake_fetch_calls: fakeFetchCalls,
      token_returned_internally: exchanged.token === fakeToken,
      public_safe_secret_free: true,
      provider_uses_exchange_helper: false,
      core_gated_publish_uses_exchange_helper: false,
      publication_adapter_uses_exchange_helper: false,
      new_dependencies_added: false,
      global_fetch_calls: globalFetchCalls,
      db_created: existsSync(dbPath),
    },
    null,
    2,
  );
  assertSecretFree(output);
  console.log(output);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

async function failIfCalledFetch() {
  throw new Error("fetchImpl should not be called before validation blocks");
}

async function assertBlocksBeforeFetch(fn) {
  await assertRejectsBounded(fn);
}

async function assertRejectsBounded(fn, expectedMessage) {
  try {
    await fn();
  } catch (error) {
    assert(error instanceof Error, "expected an Error");
    if (expectedMessage) {
      assert.equal(error.message, expectedMessage);
    }
    assertSecretFree(error.message);
    return error;
  }

  assert.fail("expected function to reject");
}

function assertPublicSafe(value) {
  assertSecretFree(JSON.stringify(value));
}

function assertSecretFree(value) {
  for (const secret of [
    fakeJwt,
    fakeToken,
    fakePrivateKeyPath,
    fakeAllowlist,
    fakeInstallationId,
  ]) {
    assert.equal(value.includes(secret), false, `value must not expose ${secret}`);
  }
}
