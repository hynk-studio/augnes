import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("GitHub App token config-boundary smoke must not call fetch.");
};

const docPath = "docs/GITHUB_APP_INSTALLATION_TOKEN_CONFIG_BOUNDARY_V0_1.md";
assert.equal(existsSync(docPath), true, "config-boundary doc should exist");

const doc = readFileSync(docPath, "utf8");

assertIncludes(doc, "design/config boundary only");
assertIncludes(doc, "GitHub App installation-token provider is not implemented");
assertIncludes(doc, "C5 token provider runtime code does not read");
assertIncludes(doc, "No JWT signing");
assertIncludes(doc, "No private key parsing");
assertIncludes(doc, "No installation access token exchange");
assertIncludes(doc, "No GitHub API call");
assertIncludes(doc, "No live publish");

for (const name of [
  "AUGNES_GITHUB_APP_ID",
  "AUGNES_GITHUB_APP_CLIENT_ID",
  "AUGNES_GITHUB_APP_PRIVATE_KEY_PATH",
  "AUGNES_GITHUB_APP_PRIVATE_KEY_BASE64",
  "AUGNES_GITHUB_APP_PRIVATE_KEY",
  "AUGNES_GITHUB_APP_INSTALLATION_ID",
  "AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST",
  "AUGNES_GITHUB_APP_PERMISSION_PROFILE",
  "AUGNES_GITHUB_APP_TOKEN_PROVIDER=installation_token",
]) {
  assertIncludes(doc, name);
}

for (const phrase of [
  "RS256",
  "`iat`",
  "`exp`",
  "`iss`",
  "not more than 10 minutes in the future",
  "/app/installations/{installation_id}/access_tokens",
  "expire after 1 hour",
  "repository allowlist",
  "permission minimization",
  "dry_run=true` remains token-free",
  "Same-key sent/acknowledged replay must remain able to return without token",
  "must not supply",
  "raw token",
  "JWT",
  "private key",
  "logged",
  "stored",
  "returned in API responses",
  "recorded as evidence",
]) {
  assertIncludes(doc, phrase);
}

for (const forbiddenField of [
  "github_token",
  "token",
  "GITHUB_TOKEN",
  "private_key",
  "app_id",
  "client_id",
  "installation_id",
]) {
  assertIncludes(doc, forbiddenField);
}

const packageJsonText = readFileSync("package.json", "utf8");
const packageJson = JSON.parse(packageJsonText);
assert.equal(
  packageJson.scripts["smoke:github-app-token-config-boundary"],
  "node scripts/smoke-github-app-token-config-boundary.mjs",
  "package.json should register smoke:github-app-token-config-boundary",
);

const providerSource = readFileSync("lib/github-token-provider.ts", "utf8");
assert.match(
  providerSource,
  /source:\s*"env_github_token"/,
  "provider should still return env_github_token as the implemented source",
);
assert.doesNotMatch(
  providerSource,
  /source:\s*"github_app_installation_token"/,
  "provider should not implement github_app_installation_token source yet",
);

const runtimeSources = [
  "lib/github-token-provider.ts",
  "lib/core-gated-publish.ts",
  "lib/github-publication.ts",
  "app/api/publication-readiness-checks/[readiness_check_id]/publish/github-pr-comment/route.ts",
].map((file) => [file, readFileSync(file, "utf8")]);

for (const [file, source] of runtimeSources) {
  assert.doesNotMatch(
    source,
    /AUGNES_GITHUB_APP_(?:ID|CLIENT_ID|PRIVATE_KEY|PRIVATE_KEY_PATH|PRIVATE_KEY_BASE64|INSTALLATION_ID|REPOSITORY_ALLOWLIST|PERMISSION_PROFILE|TOKEN_PROVIDER)/,
    `${file} should not read reserved future GitHub App config vars`,
  );
}

for (const dependencyName of ["jose", "jsonwebtoken", "jwt-simple", "node-jose"]) {
  assert.equal(
    Object.hasOwn(packageJson.dependencies ?? {}, dependencyName),
    false,
    `${dependencyName} should not be added as a runtime dependency`,
  );
  assert.equal(
    Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName),
    false,
    `${dependencyName} should not be added as a dev dependency`,
  );
}

assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");

console.log(
  JSON.stringify(
    {
      smoke: "github-app-token-config-boundary",
      doc_exists: true,
      design_only: true,
      future_config_names_documented: true,
      c5_token_provider_reads_future_config_vars: false,
      jwt_signing_implemented: false,
      private_key_parsing_implemented: false,
      installation_token_exchange_implemented: false,
      new_jwt_dependencies_added: false,
      fetch_calls: fetchCalls,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected document to include: ${expected}`,
  );
}
