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
const allowlistedTarget = "Aurna-code/augnes#139";
const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-app-target-policy-"));
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("GitHub App target policy smoke must not call fetch.");
};

try {
  const { validateGitHubAppConfig } = await import("../lib/github-app-config.ts");
  const {
    evaluateGitHubAppTargetPolicy,
  } = await import("../lib/github-app-target-policy.ts");

  const validConfig = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
      AUGNES_GITHUB_APP_PERMISSION_PROFILE: "pr_comment_minimal",
    }),
  );
  assert.equal(validConfig.status, "valid");

  const allowed = evaluateGitHubAppTargetPolicy({
    targetSurface: "github_pr_comment",
    targetRef: allowlistedTarget,
    config: validConfig,
  });
  assert.equal(allowed.allowed, true, "allowlisted target should be allowed");
  assert.equal(allowed.owner, "Aurna-code");
  assert.equal(allowed.repo, "augnes");
  assert.equal(allowed.repository, "Aurna-code/augnes");
  assert.equal(allowed.target_ref, allowlistedTarget);
  assert.equal(allowed.public_safe.allowed, true);
  assert.equal(allowed.public_safe.target_ref_valid, true);
  assert.equal(allowed.public_safe.repository_allowed, true);
  assert.equal(allowed.public_safe.repository_allowlist_count, 2);
  assertPublicSafe(allowed.public_safe);

  const caseInsensitiveConfig = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
      AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: "aurna-code/AUGNES",
    }),
  );
  assertAllowed(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: caseInsensitiveConfig,
    }),
    "allowlist matching should be case-insensitive",
  );

  const messyConfig = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
      AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST:
        " Aurna-code/augnes, Aurna-code/augnes ,octo-org/example ",
    }),
  );
  assert.equal(
    messyConfig.repository_allowlist.length,
    2,
    "config validator should trim and dedupe allowlist entries",
  );
  assertAllowed(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: messyConfig,
    }),
    "messy deduped allowlist should allow target",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: "outside-org/outside-repo#1",
      config: validConfig,
    }),
    "repository_not_allowlisted",
    "target outside allowlist should be blocked",
  );

  const emptyAllowlistConfig = validateGitHubAppConfig(
    installationEnv({
      AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath,
      AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: " ",
    }),
  );
  assert.notEqual(emptyAllowlistConfig.status, "valid");
  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: emptyAllowlistConfig,
    }),
    "repository_allowlist_empty",
    "empty allowlist should block policy",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: "not-a-pr-target",
      config: validConfig,
    }),
    "target_ref_invalid",
    "malformed target_ref should be blocked",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_issue_comment",
      targetRef: allowlistedTarget,
      config: validConfig,
    }),
    "unsupported_target_surface",
    "wrong target surface should be blocked",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: validateGitHubAppConfig({}),
    }),
    "config_unavailable",
    "unavailable config should be blocked",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: validateGitHubAppConfig(
        installationEnv({ AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: undefined }),
      ),
    }),
    "config_invalid",
    "invalid config should be blocked",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: validateGitHubAppConfig({
        AUGNES_GITHUB_APP_TOKEN_PROVIDER: "env_github_token",
      }),
    }),
    "provider_mode_not_installation_token",
    "env_github_token config should be blocked for installation-token policy",
  );

  assertBlocked(
    evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: {
        ...validConfig,
        permission_profile: "admin_everything",
      },
    }),
    "permission_profile_unsupported",
    "pr_comment_minimal permission profile should be required",
  );

  for (const privateKeyOverride of [
    { AUGNES_GITHUB_APP_PRIVATE_KEY_PATH: fakePath },
    { AUGNES_GITHUB_APP_PRIVATE_KEY: fakePlaintextKey },
    { AUGNES_GITHUB_APP_PRIVATE_KEY_BASE64: fakeBase64Key },
  ]) {
    const policy = evaluateGitHubAppTargetPolicy({
      targetSurface: "github_pr_comment",
      targetRef: allowlistedTarget,
      config: validateGitHubAppConfig(installationEnv(privateKeyOverride)),
    });
    assertPublicSafe(policy.public_safe);
  }

  const providerSource = readFileSync("lib/github-token-provider.ts", "utf8");
  assert.doesNotMatch(
    providerSource,
    /github-app-target-policy|evaluateGitHubAppTargetPolicy/,
    "publish token provider should not import/use target policy helper",
  );
  const coreGatedSource = readFileSync("lib/core-gated-publish.ts", "utf8");
  assert.doesNotMatch(
    coreGatedSource,
    /github-app-target-policy|evaluateGitHubAppTargetPolicy/,
    "core-gated publish should not import/use target policy helper",
  );
  const jwtSource = readFileSync("lib/github-app-jwt.ts", "utf8");
  assert.doesNotMatch(
    jwtSource,
    /github-app-target-policy|evaluateGitHubAppTargetPolicy/,
    "JWT helper should not import/use target policy helper",
  );

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["smoke:github-app-target-policy"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-github-app-target-policy.mjs",
    "package.json should register smoke:github-app-target-policy",
  );
  for (const dependencyName of ["jose", "jsonwebtoken", "jwt-simple", "node-jose"]) {
    assert.equal(Object.hasOwn(packageJson.dependencies ?? {}, dependencyName), false);
    assert.equal(Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName), false);
  }

  assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");
  assert.equal(existsSync(dbPath), false, "target policy smoke should not create DB");

  console.log(
    JSON.stringify(
      {
        smoke: "github-app-target-policy",
        allowlisted_target_allowed: allowed.allowed,
        case_insensitive_allowlist_match: true,
        messy_allowlist_allowed: true,
        non_allowlisted_target_blocked: true,
        malformed_target_blocked: true,
        env_github_token_config_blocked: true,
        public_safe_secret_free: true,
        provider_uses_target_policy: false,
        core_gated_publish_uses_target_policy: false,
        jwt_helper_uses_target_policy: false,
        new_dependencies_added: false,
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

function installationEnv(overrides = {}) {
  return {
    AUGNES_GITHUB_APP_TOKEN_PROVIDER: "installation_token",
    AUGNES_GITHUB_APP_CLIENT_ID: "Iv1.fakeclient",
    AUGNES_GITHUB_APP_INSTALLATION_ID: fakeInstallationId,
    AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST: fakeAllowlist,
    ...overrides,
  };
}

function assertAllowed(decision, message) {
  assert.equal(decision.allowed, true, message);
  assert.equal(decision.public_safe.allowed, true, message);
}

function assertBlocked(decision, blockedReason, message) {
  assert.equal(decision.allowed, false, message);
  assert.equal(decision.public_safe.allowed, false, message);
  assert(
    decision.blocked_reasons.includes(blockedReason),
    `${message}: expected blocked reason ${blockedReason}`,
  );
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
