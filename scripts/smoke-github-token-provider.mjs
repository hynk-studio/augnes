import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const fakeToken = "ghp_augnes_fake_token_value_must_not_appear";
const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-token-provider-"));
const dbPath = path.join(tempDir, "augnes.db");
const originalToken = process.env.GITHUB_TOKEN;
const originalOpenAIKey = process.env.OPENAI_API_KEY;

process.env.AUGNES_DB_PATH = dbPath;
delete process.env.OPENAI_API_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("GitHub token provider smoke must not call fetch.");
};

try {
  const {
    resolveGitHubPublishToken,
    redactGitHubTokenResolutionForResponse,
  } = await import("../lib/github-token-provider.ts");

  delete process.env.GITHUB_TOKEN;
  const unavailable = resolveGitHubPublishToken();
  assert.equal(unavailable.available, false, "unset GITHUB_TOKEN should be unavailable");
  assert.equal(unavailable.source, null, "unset GITHUB_TOKEN should have no source");
  assert.equal(unavailable.token, null, "unset GITHUB_TOKEN should not return a token");
  assert.equal(
    unavailable.unavailable_reason,
    "GITHUB_TOKEN is not configured for this runtime.",
    "unset GITHUB_TOKEN should explain unavailability",
  );

  process.env.GITHUB_TOKEN = `  ${fakeToken}  `;
  const available = resolveGitHubPublishToken();
  assert.equal(available.available, true, "set GITHUB_TOKEN should be available");
  assert.equal(
    available.source,
    "env_github_token",
    "set GITHUB_TOKEN should report env source",
  );
  assert.equal(available.token, fakeToken, "provider may return raw token internally");
  assert.match(
    available.token_fingerprint ?? "",
    /^sha256:[0-9a-f]{12}$/,
    "provider should expose only a bounded fingerprint",
  );
  assert.equal(available.expires_at, null, "env token should not claim an expiry");

  const publicSafe = redactGitHubTokenResolutionForResponse(available);
  assert.equal(
    Object.hasOwn(publicSafe, "token"),
    false,
    "public-safe token metadata should omit raw token field",
  );
  assert.equal(
    Object.hasOwn(publicSafe, "token_fingerprint"),
    false,
    "public-safe token metadata should omit fingerprint by default",
  );
  assert.equal(
    JSON.stringify(publicSafe).includes(fakeToken),
    false,
    "public-safe token metadata must not contain raw token",
  );

  const coreSource = readFileSync("lib/core-gated-publish.ts", "utf8");
  assert.match(
    coreSource,
    /resolveGitHubPublishToken/,
    "core-gated publish should use token provider abstraction",
  );
  assert.doesNotMatch(
    coreSource,
    /process\.env\.GITHUB_TOKEN|readRuntimeGitHubToken/,
    "core-gated publish should not read process.env.GITHUB_TOKEN directly",
  );
  assert.match(
    coreSource,
    /gate\.existing_delivery[\s\S]+idempotent_replay[\s\S]+resolveGitHubPublishToken/,
    "same-key sent/acknowledged replay should return before token resolution",
  );
  assert.match(
    coreSource,
    /buildDryRunPublishPreview[\s\S]+validateCoreGatedPublish/,
    "dry_run=true preview path should remain a gate-only path",
  );
  assert.match(
    coreSource,
    /requires GitHub publish token availability before creating delivery rows or invoking the GitHub adapter/,
    "dry_run=false should still require token availability before adapter execution",
  );
  const publicationSource = readFileSync("lib/github-publication.ts", "utf8");
  assert.doesNotMatch(
    publicationSource,
    /process\.env\.GITHUB_TOKEN/,
    "GitHub publication adapter should not resolve process.env.GITHUB_TOKEN",
  );

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["smoke:github-token-provider"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-github-token-provider.mjs",
    "package.json should register smoke:github-token-provider",
  );

  const tokenDoc = readFileSync("docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1.md", "utf8");
  assert.match(
    tokenDoc,
    /Current implemented provider:[\s\S]*env `GITHUB_TOKEN` only/,
    "token management doc should name env GITHUB_TOKEN as current provider",
  );
  assert.match(
    tokenDoc,
    /GitHub App installation token[\s\S]*design only[\s\S]*separate PR/i,
    "token management doc should keep GitHub App installation token support design-only",
  );
  assert.doesNotMatch(
    tokenDoc,
    /implemented GitHub App installation-token exchange/i,
    "token management doc should not claim app token exchange is implemented",
  );

  const output = JSON.stringify(
    {
      smoke: "github-token-provider",
      unset_available: unavailable.available,
      set_available: available.available,
      source: available.source,
      public_safe_has_token: Object.hasOwn(publicSafe, "token"),
      fetch_calls: fetchCalls,
      db_created: existsSync(dbPath),
      core_uses_provider: true,
      dry_run_token_free: true,
      same_key_replay_before_token_resolution: true,
      github_app_installation_token_design_only: true,
    },
    null,
    2,
  );

  assert.equal(output.includes(fakeToken), false, "smoke output must not print fake token");
  assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");
  assert.equal(existsSync(dbPath), false, "provider smoke should not create or mutate DB");

  console.log(output);
} finally {
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN;
  } else {
    process.env.GITHUB_TOKEN = originalToken;
  }
  if (originalOpenAIKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAIKey;
  }
  rmSync(tempDir, { recursive: true, force: true });
}
