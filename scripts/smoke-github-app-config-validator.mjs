import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const fakePath = "/very/secret/local/path/augnes-app-private-key.pem";
const fakePlaintextKey =
  "-----BEGIN PRIVATE KEY-----\\naugnes-fake-private-key\\n-----END PRIVATE KEY-----";
const fakeBase64Key = "YXVnbmVzLWZha2UtYmFzZTY0LXByaXZhdGUta2V5";
const fakeInstallationId = "987654321";
const fakeAllowlist = "Aurna-code/augnes,octo-org/example";
const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-app-config-"));
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("GitHub App config validator smoke must not call fetch.");
};

try {
  const {
    readGitHubAppConfig,
    validateGitHubAppConfig,
    validateRuntimeGitHubAppConfig,
  } = await import("../lib/github-app-config.ts");

  const unavailable = validateGitHubAppConfig({});
  assert.equal(unavailable.status, "unavailable", "no config should be unavailable");
  assert.deepEqual(unavailable.invalid, [], "no config should have no invalid errors");

  const complete = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
      AUGNES_GITHUB_APP_PERMISSION_PROFILE: "pr_comment_minimal",
    }),
  );
  assert.equal(complete.status, "valid", "complete fake config should be valid");
  assert.equal(complete.provider_mode, "installation_token");
  assert.equal(complete.issuer_kind, "client_id");
  assert.equal(complete.private_key_source, "file_path");
  assert.equal(complete.installation_id, fakeInstallationId);
  assert.deepEqual(complete.repository_allowlist, [
    "Aurna-code/augnes",
    "octo-org/example",
  ]);

  const bothIssuers = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_ID: "12345",
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
    }),
  );
  assert.equal(bothIssuers.status, "valid", "both issuer IDs should remain valid");
  assert.equal(bothIssuers.issuer_kind, "client_id", "client_id should be preferred");
  assert(
    bothIssuers.warnings.some((warning) => warning.includes("client ID will be preferred")),
    "both issuer IDs should produce a preference warning",
  );

  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({ AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath }, false),
    ),
    "missing issuer should be invalid",
  );
  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({
        AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
        AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
        AUGNES_GITHUB_APP_INSTALLATION_ID: undefined,
      }),
    ),
    "missing installation id should be invalid",
  );
  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({
        AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
        AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
        AUGNES_GITHUB_APP_INSTALLATION_ID: "not-numeric",
      }),
    ),
    "nonnumeric installation id should be invalid",
  );
  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({ AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient" }),
    ),
    "missing private key source should be invalid",
  );
  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({
        AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
        AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
        AUGNES_GITHUB_APP_PRIVATE_KEY: fakePlaintextKey,
      }),
    ),
    "multiple private key sources should be invalid",
  );

  const pathSource = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
    }),
  );
  assert.equal(pathSource.private_key_source, "file_path");
  assertPublicSafe(pathSource.public_safe);

  const plaintextSource = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY: fakePlaintextKey,
    }),
  );
  assert.equal(plaintextSource.private_key_source, "env_plaintext");
  assertPublicSafe(plaintextSource.public_safe);

  const base64Source = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY_BASE64: fakeBase64Key,
    }),
  );
  assert.equal(base64Source.private_key_source, "env_base64");
  assertPublicSafe(base64Source.public_safe);

  const allowlist = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
      AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST:
        " Aurna-code/augnes, Aurna-code/augnes ,octo-org/example ",
    }),
  );
  assert.deepEqual(
    allowlist.repository_allowlist,
    ["Aurna-code/augnes", "octo-org/example"],
    "allowlist should trim and dedupe owner/repo entries",
  );

  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({
        AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
        AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
        AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: "Aurna-code/augnes,bad-entry",
      }),
    ),
    "malformed allowlist entry should be invalid",
  );
  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({
        AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
        AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
        AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: "   ",
      }),
    ),
    "empty allowlist should be invalid",
  );
  assertInvalid(
    validateGitHubAppConfig(
      installationEnv({
        AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
        AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
        AUGNES_GITHUB_APP_PERMISSION_PROFILE: "admin_everything",
      }),
    ),
    "unknown permission profile should be invalid",
  );

  const defaultProfile = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
    }),
  );
  assert.equal(defaultProfile.permission_profile, "pr_comment_minimal");
  assert(
    defaultProfile.warnings.some((warning) =>
      warning.includes("defaulting to pr_comment_minimal"),
    ),
    "default permission profile behavior should be explicit",
  );

  assertInvalid(
    validateGitHubAppConfig({ AUGNES_GITHUB_APP_TOKEN_PROVIDER: "surprise" }),
    "unknown provider mode should be invalid",
  );

  const envProvider = validateGitHubAppConfig({
    AUGNES_GITHUB_APP_TOKEN_PROVIDER: "env_github_token",
  });
  assert.equal(envProvider.status, "valid", "env_github_token mode should be valid");
  assert(
    envProvider.warnings.some((warning) =>
      warning.includes("resolveGitHubPublishToken()"),
    ),
    "env_github_token mode should warn that provider behavior is elsewhere",
  );

  const readConfig = readGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
    }),
  );
  assert.deepEqual(readConfig.private_key_sources, ["file_path"]);

  const originalProvider = process.env.AUGNES_GITHUB_APP_TOKEN_PROVIDER;
  process.env.AUGNES_GITHUB_APP_TOKEN_PROVIDER = "env_github_token";
  const runtimeValidation = validateRuntimeGitHubAppConfig();
  assert.equal(runtimeValidation.provider_mode, "env_github_token");
  restoreEnv("AUGNES_GITHUB_APP_TOKEN_PROVIDER", originalProvider);

  const providerSource = readFileSync("lib/github-token-provider.ts", "utf8");
  assert.match(
    providerSource,
    /source:\s*"env_github_token"/,
    "publish token provider should still implement env_github_token",
  );
  assert.doesNotMatch(
    providerSource,
    /github-app-config|validateGitHubAppConfig|readGitHubAppConfig/,
    "publish token provider should not import/use GitHub App config validator",
  );
  assert.doesNotMatch(
    providerSource,
    /source:\s*"github_app_installation_token"/,
    "publish token provider should not resolve installation_token yet",
  );

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["smoke:github-app-config-validator"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-github-app-config-validator.mjs",
    "package.json should register smoke:github-app-config-validator",
  );
  for (const dependencyName of ["jose", "jsonwebtoken", "jwt-simple", "node-jose"]) {
    assert.equal(Object.hasOwn(packageJson.dependencies ?? {}, dependencyName), false);
    assert.equal(Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName), false);
  }

  assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");
  assert.equal(existsSync(dbPath), false, "config validator smoke should not create DB");

  console.log(
    JSON.stringify(
      {
        smoke: "github-app-config-validator",
        no_config_status: unavailable.status,
        complete_fake_config_status: complete.status,
        client_id_preferred: bothIssuers.issuer_kind === "client_id",
        default_permission_profile: defaultProfile.permission_profile,
        public_safe_secret_free: true,
        provider_uses_installation_token: false,
        new_jwt_dependencies_added: false,
        fetch_calls: fetchCalls,
        db_created: existsSync(dbPath),
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function installationEnv(overrides = {}, includeIssuer = true) {
  return {
    AUGNES_GITHUB_APP_TOKEN_PROVIDER: "installation_token",
    AUGNES_GITHUB_APP_CLIENT_ID: includeIssuer ? "Iv1.fakeclient" : undefined,
    AUGNES_GITHUB_APP_INSTALLATION_ID: fakeInstallationId,
    AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: fakeAllowlist,
    ...overrides,
  };
}

function assertInvalid(validation, message) {
  assert.equal(validation.status, "invalid", message);
}

function assertPublicSafe(publicSafe) {
  const serialized = JSON.stringify(publicSafe);
  for (const secret of [
    fakePath,
    fakePlaintextKey,
    fakeBase64Key,
    fakeInstallationId,
    fakeAllowlist,
  ]) {
    assert.equal(
      serialized.includes(secret),
      false,
      `public_safe must not expose ${secret}`,
    );
  }
}

function restoreEnv(name, originalValue) {
  if (originalValue === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = originalValue;
  }
}
